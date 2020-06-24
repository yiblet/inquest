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
from inquest.comms.version_checker import check_version
from inquest.probe import Probe

LOGGER = logging.getLogger(__name__)

_LOCK = threading.Lock()
_ENABLED = False


# TODO split out logic of probe runner to only be connecting together 1 or 2
#      existing services rather than running the logic itself
# TODO relative imports are no longer possible to use
class ProbeRunner(threading.Thread):
    """
    runs the probe on a separate thread and communicates to the endpoint
    @param package: the package of the calling function (used for resolving relative imports)
    @param trace_set_id: which trace_set_id to subscribe to for commands
    @param send_modules: whether or not to send_file information to the endpoint for
                         visualization purposes
    """

    package: str
    probe: Probe
    trace_set_id: str

    def __init__(
        self,
        *,
        package: str,
        trace_set_id: str,
        host: str,
        port: int,
        ssl: bool,
        glob: Optional[Union[str, List[str]]],
        exclude: Optional[List[str]],
    ):
        super().__init__()
        self.package = package
        self.trace_set_id = trace_set_id
        self.send_modules = glob is not None
        self.endpoint = f"{host}:{port}"
        self.ssl = ssl
        self.probe = Probe(package)
        self.glob = glob
        self.exclude = exclude

    @property
    def _ssl_suffix(self):
        return "" if not self.ssl else "s"

    def client_consumers(self):
        sender = ExceptionSender()
        consumers = [
            TraceSetSubscriber(
                probe=self.probe,
                package=self.package,
                exception_sender=sender,
            ),
            LogSender(exception_sender=sender),
            Heartbeat(),
            sender,
        ]

        if self.send_modules:
            consumers.append(
                ModuleSender(
                    url=f'http{self._ssl_suffix}://{self.endpoint}/api/upload',
                    glob=self.glob,
                    exclude=self.exclude,
                )
            )
        return consumers

    def run(self):
        """
        The ProbeRunner's main loop. This fires up the full inquest probe.
        It starts communicating with the backend in a background thread.
        """
        # pylint: disable=global-statement, broad-except
        global _ENABLED
        try:
            LOGGER.info('inquest daemon is running')
            evloop = asyncio.new_event_loop()
            evloop.run_until_complete(self._run_async())
            LOGGER.info('inquest daemon closed')
        except Exception as err:
            LOGGER.error(
                "inquest daemon stopped due to exception",
                extra={'error': err}
            )
            # when the runner fails out we set enabled to false again
            with _LOCK:
                _ENABLED = False

    async def _run_async(self):
        url = f'ws{self._ssl_suffix}://{self.endpoint}/api/graphql'

        # checks that the versions match between the backend and the frontend
        await check_version(
            f'http{self._ssl_suffix}://{self.endpoint}/api/version'
        )

        consumers = self.client_consumers()
        async with ClientProvider(
                trace_set_id=self.trace_set_id,
                url=url,
                ssl=self.ssl,
                consumers=consumers,
        ) as provider:
            await provider.main()


def enable(
    *,
    api_key: str,
    host: str = "inquest.dev",
    port: int = 443,
    ssl: Optional[bool] = None,
    glob: Optional[Union[str, List[str]]] = None,
    daemon: bool = True,
    package: Optional[str] = None,
    exclude: Optional[List[str]] = None,
    force_start: bool = False,
) -> None:
    '''
    runs the probe in a separate thread
    '''

    # pylint: disable=global-statement
    # _ENABLED & _LOCK to prevent inquest daemon from being fired
    # up more than once in a given python thread
    global _ENABLED
    with _LOCK:
        if _ENABLED and not force_start:
            return
        if ssl is None:
            # set ssl to true if the port points to the classic ssl port
            ssl = port == 443
        if package is None:
            frame = inspect.stack()[1]
            mod = inspect.getmodule(frame[0])
            package = mod.__name__
        probe = ProbeRunner(
            package=package,
            trace_set_id=api_key,
            host=host,
            port=port,
            glob=glob,
            ssl=ssl,
            exclude=exclude,
        )
        probe.setName('inquest probe')
        probe.setDaemon(daemon)
        probe.start()
        _ENABLED = True
