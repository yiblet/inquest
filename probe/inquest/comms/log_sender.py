import asyncio
import logging
from typing import List, NamedTuple, Union

import janus
from gql import gql

from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.exception_sender import ExceptionSender
from inquest.comms.utils import wrap_log
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

    def __init__(self, *, exception_sender: ExceptionSender):
        super().__init__()
        self.exception_sender = exception_sender

        self.log_queue: asyncio.Queue = None
        self.query = gql(
            """\
mutation PublishLogMutation($content: [String!]!) {
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

    async def _send_log(self, log_content: List[str]):
        LOGGER.debug('sending: %s', log_content)
        params = {
            "content": log_content,
            "traceSetId": self.trace_set_id,
        }

        return await wrap_log(
            LOGGER,
            self.client.execute(self.query, variable_values=params),
        )

    @staticmethod
    def add_to_buffers(
        log_buffer: List[Log], error_buffer: List[Error],
        log_content: Union[Log, Error]
    ):
        if isinstance(log_content, Log):
            log_buffer.append(log_content)
        elif isinstance(log_content, Error):
            error_buffer.append(log_content)

    async def main(self):
        LOGGER.info("sending logs")

        next_queue_value = asyncio.create_task(self.log_queue.async_q.get())
        while True:
            logs = []
            errors = []
            log_content = await next_queue_value
            self.add_to_buffers(logs, errors, log_content)
            self.log_queue.async_q.task_done()
            sleep_task = asyncio.create_task(asyncio.sleep(0.05))

            buffering = True

            # buffer up the messages

            while buffering:
                next_queue_value = asyncio.create_task(
                    self.log_queue.async_q.get()
                )
                finished, unfinished = await asyncio.wait(
                    [
                        sleep_task,
                        next_queue_value,
                    ],
                    return_when=asyncio.FIRST_COMPLETED
                )
                buffering = sleep_task in unfinished
                if next_queue_value in finished:
                    self.add_to_buffers(logs, errors, await next_queue_value)
                    self.log_queue.async_q.task_done()
                    if not buffering:
                        next_queue_value = asyncio.create_task(
                            self.log_queue.async_q.get()
                        )

            if len(logs) != 0:
                await self._send_log([log.log for log in logs])
            if len(errors) != 0:
                await asyncio.gather(
                    [
                        self.exception_sender.send_exception(
                            ProbeException(
                                message=str(log_content.error),
                                trace_id=log_content.trace_id,
                            )
                        ) for log_content in errors
                    ]
                )

        LOGGER.info("logs finished being sent")
