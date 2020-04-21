import asyncio
import logging

from inquest.comms.client_consumer import ClientConsumer
# from inquest.comms.utils import log_result
from inquest.logging import with_callback

LOGGER = logging.getLogger(__name__)


class LogSender(ClientConsumer):

    def __init__(self):
        super().__init__()
        self.log_queue: asyncio.Queue = None

    async def __aenter__(self):
        await super().__aenter__()
        self.log_queue = asyncio.Queue(loop=asyncio.get_event_loop())
        await self.enter_async_context(with_callback(self.log_callback))
        return self

    def log_callback(self, log_content: str):
        try:
            self.log_queue.put_nowait(log_content)
        except asyncio.QueueFull as error:
            LOGGER.error(error)

    # TODO complete this function
    async def _send_log(self, log_content: str):
        LOGGER.debug('sending: %s', log_content)

    async def main(self):
        LOGGER.info("sending logs")

        while True:
            log_content = await self.log_queue.get()
            await self._send_log(log_content)

        LOGGER.info("logs finished being sent")
