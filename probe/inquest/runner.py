import asyncio
import inspect
import logging
import threading
from typing import Optional

from gql.transport.websockets import WebsocketsTransport

from inquest.comms.client_provider import ClientProvider
from inquest.comms.log_sender import LogSender
from inquest.comms.module_sender import ModuleSender
from inquest.comms.trace_set_subscriber import TraceSetSubscriber
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

    def client_consumers(self):
        consumers = [
            TraceSetSubscriber(
                probe=self.probe,
                trace_set_key=self.trace_set_key,
                package=self.package,
            ),
            LogSender()
        ]

        if self.send_modules:
            consumers.append(
                ModuleSender(
                    url=f'http://{self.endpoint}/upload', package=self.package
                )
            )
        return consumers

    def run(self):
        LOGGER.info('inquest daemon is running')
        evloop = asyncio.new_event_loop()
        evloop.run_until_complete(self._run_async())
        LOGGER.info('inquest daemon closed')

    async def _run_async(self):
        transport = WebsocketsTransport(
            url=f'ws://{self.endpoint}/graphql',
            ssl=None,
        )
        async with ClientProvider(
                transport,
                self.client_consumers(),
        ) as provider:
            await provider.main()


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
    probe = ProbeRunner(package, "default", True)
    probe.setName('inquest probe')
    probe.setDaemon(daemon)
    probe.start()


if __name__ == "__main__":
    enable(daemon=False)
