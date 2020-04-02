# import asyncio
import asyncio
import inspect
import logging
import threading
from collections import OrderedDict
from typing import Optional

from gql import AsyncClient, gql
from gql.transport.websockets import WebsocketsTransport

LOGGER = logging.getLogger(__name__)


class ProbeRunner(threading.Thread):

    package: str

    def __init__(self, package: str):
        super().__init__()
        self.package = package

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
            subscription = gql('''
subscription {
  newTraceSubscription {
    module
    function
    statement
  }
}
            ''')
            async for result in client.subscribe(subscription):
                result: OrderedDict = result.to_dict()
                __import__('pprint').pprint(result)


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
