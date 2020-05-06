import asyncio
import inspect
import logging
import threading
from typing import List, Optional, Union

from inquest.comms.client_provider import ClientProvider
from inquest.comms.exception_sender import ExceptionSender
from inquest.comms.heartbeat import Heartbeat
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
        *,
        root: str,
        package: str,
        trace_set_key: str,
        host: str,
        port: int,
        glob: Optional[Union[str, List[str]]],
        exclude: Optional[List[str]],
    ):
        super().__init__()
        self.package = package
        self.trace_set_key = trace_set_key
        self.send_modules = glob is not None
        self.endpoint = f"{host}:{port}"
        self.root = root
        self.probe = Probe(root, package)
        self.glob = glob
        self.exclude = exclude

    def client_consumers(self):
        sender = ExceptionSender()
        consumers = [
            TraceSetSubscriber(
                probe=self.probe,
                trace_set_key=self.trace_set_key,
                package=self.package,
                exception_sender=sender,
            ),
            LogSender(
                trace_set_key=self.trace_set_key,
                exception_sender=sender,
            ),
            Heartbeat(),
            sender,
        ]

        if self.send_modules:
            consumers.append(
                ModuleSender(
                    url=f'http://{self.endpoint}/upload',
                    root=self.root,
                    package=self.package,
                    glob=self.glob,
                    exclude=self.exclude,
                )
            )
        return consumers

    def run(self):
        LOGGER.info('inquest daemon is running')
        evloop = asyncio.new_event_loop()
        evloop.run_until_complete(self._run_async())
        LOGGER.info('inquest daemon closed')

    async def _run_async(self):
        url = f'ws://{self.endpoint}/graphql'
        consumers = self.client_consumers()
        async with ClientProvider(
                trace_set_key=self.trace_set_key,
                url=url,
                consumers=consumers,
        ) as provider:
            await provider.main()


# TODO pass the TraceSet Key in as an argument
def enable(
    *,
    root: str,
    host: str = "localhost",
    port: int = 4000,
    glob: Optional[Union[str, List[str]]] = None,
    daemon: bool = True,
    package: Optional[str] = None,
    exclude: Optional[List[str]] = None,
) -> None:
    '''
    runs the probe in a separate thread
    '''

    if package is None:
        frame = inspect.stack()[1]
        mod = inspect.getmodule(frame[0])
        package = mod.__name__
    probe = ProbeRunner(
        root=root,
        package=package,
        trace_set_key="default",
        host=host,
        port=port,
        glob=glob,
        exclude=exclude,
    )
    probe.setName('inquest probe')
    probe.setDaemon(daemon)
    probe.start()


if __name__ == "__main__":
    enable(daemon=False)
