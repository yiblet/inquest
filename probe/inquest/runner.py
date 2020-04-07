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
    module: str
    function: str
    statement: str


class ProbeRunner(threading.Thread):

    package: str
    probe: Probe

    def __init__(self, package: str):
        super().__init__()
        self.package = package
        self.probe = Probe(package)

    def run(self):
        LOGGER.info('inquest daemon is running')
        evloop = asyncio.new_event_loop()
        evloop.run_until_complete(self._run_async())
        LOGGER.info('inquest daemon closed')

    def _new_trace(self, trace: NewTraceSubscription):
        injection = self.probe.upsert_log(
            module=trace.module,
            function=trace.function,
            statement=trace.statement,
        )
        if not injection.enabled or injection.error is not None:
            if not injection.enabled and injection.error is None:
                LOGGER.warning('injection failed')
            else:
                LOGGER.warning(
                    'injection failed with error %s',
                    injection.error,
                )

    async def _run_async(self):
        transport = WebsocketsTransport(
            url='ws://localhost:4000/graphql',
            ssl=None,
        )

        async with AsyncClient(transport=transport) as client:
            # Fetch schema (optional)
            await client.fetch_schema()

            # Request subscription
            subscription = gql('''
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
            ''' % ("test-key"))

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
                if 'data' not in result:
                    continue


def enable(daemon: bool = True, package: Optional[str] = None) -> None:
    '''
    runs the probe in a separate thread
    '''

    if package is None:
        frame = inspect.stack()[1]
        mod = inspect.getmodule(frame[0])
        package = mod.__name__
    probe = ProbeRunner(package)
    probe.setName('inquest probe')
    probe.setDaemon(daemon)
    probe.start()


if __name__ == "__main__":
    enable(daemon=False)
