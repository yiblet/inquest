# import asyncio
import asyncio
import inspect
import json
import logging
import threading
from collections import OrderedDict
from typing import NamedTuple, Optional

from gql import AsyncClient, gql
from gql.transport.websockets import WebsocketsTransport

from inquest.probe import Probe

LOGGER = logging.getLogger(__name__)


class NewTraceSubscription(NamedTuple):
    id: str
    module: str
    function: str
    statement: str


class ProbeRunner(threading.Thread):

    package: str
    probe: Probe
    trace_set_key: str

    def __init__(self, package: str, trace_set_key: str):
        super().__init__()
        self.package = package
        self.trace_set_key = trace_set_key
        self.probe = Probe(package)

    def run(self):
        LOGGER.info('inquest daemon is running')
        evloop = asyncio.new_event_loop()
        evloop.run_until_complete(self._run_async())
        LOGGER.info('inquest daemon closed')

    async def _run_async(self):
        transport = WebsocketsTransport(
            url='ws://localhost:4000/graphql',
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


# TODO pass the TraceSet Key in as an argument
def enable(daemon: bool = True, package: Optional[str] = None) -> None:
    '''
    runs the probe in a separate thread
    '''

    if package is None:
        frame = inspect.stack()[1]
        mod = inspect.getmodule(frame[0])
        package = mod.__name__
    probe = ProbeRunner(package, "trace_set")
    probe.setName('inquest probe')
    probe.setDaemon(daemon)
    probe.start()


if __name__ == "__main__":
    enable(daemon=False)
