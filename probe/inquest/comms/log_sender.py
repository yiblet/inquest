import asyncio
import logging

import janus
from gql import gql

from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.utils import log_result
from inquest.logging import with_callback

LOGGER = logging.getLogger(__name__)


class LogSender(ClientConsumer):

    def __init__(self, *, trace_set_key: str):
        super().__init__()
        self.trace_set_key = trace_set_key

        self.log_queue: asyncio.Queue = None
        self.query = gql(
            """\
mutation PublishLogMutation($content: String!, $traceSetKey: String!) {
  publishLog(content: $content, traceSetKey: $traceSetKey)
}
                    """
        )

    async def __aenter__(self):
        await super().__aenter__()
        self.log_queue = janus.Queue(loop=asyncio.get_event_loop())
        self.enter_context(with_callback(self.log_callback))
        return self

    def log_callback(self, log_content: str):
        try:
            self.log_queue.sync_q.put(log_content)
        except asyncio.QueueFull as error:
            LOGGER.error(error)

    async def _send_log(self, log_content: str):
        LOGGER.debug('sending: %s', log_content)
        params = {
            "content": log_content,
            "traceSetKey": self.trace_set_key,
        }

        result = await self.client.execute(self.query, variable_values=params)
        result = result.to_dict()
        log_result(LOGGER, result)

    async def main(self):
        LOGGER.info("sending logs")

        while True:
            log_content = await self.log_queue.async_q.get()
            await self._send_log(log_content)
            self.log_queue.async_q.task_done()

        LOGGER.info("logs finished being sent")
