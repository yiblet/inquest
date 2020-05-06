import asyncio
import logging
from typing import NamedTuple

import janus

from gql import gql
from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.exception_sender import ExceptionSender
from inquest.comms.utils import log_result
from inquest.logging import Callback, with_callback
from inquest.utils.exceptions import ProbeException

LOGGER = logging.getLogger(__name__)


class Log(NamedTuple):
    log: str


class Error(NamedTuple):
    trace_id: str
    error: str


class LogSenderCallback(Callback):

    def __init__(self, log_queue):
        super().__init__()
        self.log_queue = log_queue

    def log(self, value: str):
        try:
            self.log_queue.sync_q.put(Log(value))
        except asyncio.QueueFull as error:
            LOGGER.error(error)

    def error(self, trace_id: str, value: str):
        try:
            self.log_queue.sync_q.put(Error(trace_id, value))
        except asyncio.QueueFull as error:
            LOGGER.error(error)


class LogSender(ClientConsumer):

    def __init__(
        self, *, trace_set_key: str, exception_sender: ExceptionSender
    ):
        super().__init__()
        self.trace_set_key = trace_set_key
        self.exception_sender = exception_sender

        self.log_queue: asyncio.Queue = None
        self.query = gql(
            """\
mutation PublishLogMutation($content: String!) {
  publishLog(content: $content)
}
                    """
        )

    async def __aenter__(self):
        await super().__aenter__()
        self.log_queue = janus.Queue()
        self.enter_context(with_callback(self.gen_callback()))
        return self

    def gen_callback(self):
        return LogSenderCallback(self.log_queue)

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
            if isinstance(log_content, Log):
                await self._send_log(log_content.log)
            elif isinstance(log_content, Error):
                await self.exception_sender.send_exception(
                    ProbeException(
                        message=str(log_content.error),
                        trace_id=log_content.trace_id,
                    )
                )
            self.log_queue.async_q.task_done()

        LOGGER.info("logs finished being sent")
