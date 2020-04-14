import asyncio
import contextlib
import inspect
import json
import logging
import sys
import threading
from collections import OrderedDict
from typing import Optional

from gql import AsyncClient, gql
from gql.transport.websockets import WebsocketsTransport

from inquest.file_sender import FileSender
from inquest.module_tree import ModuleInfo, ModuleTree, convert_module_info
from inquest.probe import Probe

LOGGER = logging.getLogger(__name__)


# TODO split out logic of probe runner to only be connecting together 1 or 2
#      existing services rather than running the logic itself
# TODO relative imports are no longer possible to use
class ProbeRunner(threading.Thread):
    """
    runs the probe on a separate thread and communicates to the endpoint
    @param package: the package of the calling function (used for resolving relative imports)
    @param trace_set_key: which trace_set_key to subscribe to for commands
    @param send_modules: whether or not to send_file information to the endpoint for
                         visualization purposes
    """

    package: str
    probe: Probe
    trace_set_key: str

    def __init__(
        self,
        package: str,
        trace_set_key: str,
        send_modules: bool,
    ):
        super().__init__()
        self.package = package
        self.trace_set_key = trace_set_key
        self.send_modules = send_modules
        self.endpoint = "localhost:4000"
        self.probe = Probe(package)

    def run(self):
        LOGGER.info('inquest daemon is running')
        evloop = asyncio.new_event_loop()
        evloop.run_until_complete(self._run_async())
        LOGGER.info('inquest daemon closed')

    @staticmethod
    def log_result(result: OrderedDict):
        if 'errors' in result:
            LOGGER.warning(
                "backend returned with errors: %s",
                json.dumps(result['errors']),
            )
        if 'data' in result:
            LOGGER.debug(
                "backend returned with data: %s",
                json.dumps(result['data']),
            )

    async def _send_module(
        self, module: ModuleInfo, client: AsyncClient, file_id: int
    ):
        query = gql(
            """
mutation createModuleMutation($input: ModuleInput!) {
  createModule(module: $input) {
    name
    childClasses {
      name
      methods {
        name
      }
    }
    childFunctions {
      name
    }
  }
}
            """
        )
        params = {
            "input": convert_module_info(module, file_id),
        }
        LOGGER.debug("input params %s", params)

        result = await client.execute(query, variable_values=params)
        result = result.to_dict()

        self.log_result(result)

    async def _send_modules(self):
        transport = WebsocketsTransport(
            url=f'ws://{self.endpoint}/graphql',
            ssl=None,
        )

        LOGGER.info("sending modules")
        module_tree = ModuleTree(sys.modules[self.package].__file__)

        async with contextlib.AsyncExitStack() as stack:
            stack: contextlib.AsyncExitStack = stack
            client: AsyncClient = await stack.enter_async_context(
                AsyncClient(retries=3, transport=transport)
            )
            sender: FileSender = await stack.enter_async_context(
                FileSender(f'http://{self.endpoint}/upload')
            )
            await client.fetch_schema()

            for module in module_tree.modules():
                file_name = module.file
                if not file_name:
                    LOGGER.warning(
                        "ModuleTree pulled a module with no known file: %s",
                        module.__name__
                    )
                    continue
                response = (await sender.send_file(module.file))
                file_id: str = (response).get("fileId")
                if file_id is None:
                    LOGGER.error("failed to send file to endpoint")
                    continue
                await self._send_module(module, client, file_id)

        LOGGER.info("modules finished being sent")

    async def _subscription(self):
        transport = WebsocketsTransport(
            url=f'ws://{self.endpoint}/graphql',
            ssl=None,
        )
        async with AsyncClient(transport=transport) as client:
            # Fetch schema (optional)
            await client.fetch_schema()

            # Request subscription
            subscription = gql(
                '''
subscription probeNotification {
  probeNotification(traceSetKey: "%s") {
    message
    traceSet {
      key
      desiredSet {
        id
        module
        function
        statement
      }
    }
  }
}
            ''' % (self.trace_set_key)
            )

            async for result in client.subscribe(subscription):
                result: OrderedDict = result.to_dict()
                self.log_result(result)
                if 'data' in result:
                    desired_set = result['data']['probeNotification'][
                        'traceSet']['desiredSet']
                    errors = self.probe.new_desired_state(desired_set)
                    if errors is not None:
                        for (module, function), error in errors.items():
                            LOGGER.warning(
                                'error in %s:%s %s',
                                module,
                                function,
                                error,
                            )

    async def _run_async(self):
        if self.send_modules:
            task = asyncio.create_task(self._send_modules())
            task2 = asyncio.create_task(self._subscription())
            await task
            await task2
        else:
            await self._subscription()


# TODO pass the TraceSet Key in as an argument
# TODO pass the send_modules value in as an argument
# TODO make it possible to pass in an endpoint url
def enable(
        daemon: bool = True,
        package: Optional[str] = None,
) -> None:
    '''
    runs the probe in a separate thread
    '''

    if package is None:
        frame = inspect.stack()[1]
        mod = inspect.getmodule(frame[0])
        package = mod.__name__
    probe = ProbeRunner(package, "trace_set", True)
    probe.setName('inquest probe')
    probe.setDaemon(daemon)
    probe.start()


if __name__ == "__main__":
    enable(daemon=False)
