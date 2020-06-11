import asyncio
import logging

from gql import gql

from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.utils import wrap_log

LOGGER = logging.getLogger(__name__)


class Heartbeat(ClientConsumer):
    """
    Periodically polls the backend to tell it it's still alive
    """

    def __init__(self, *, delay: int = 60):
        super().__init__()
        self.delay = delay
        self.query = gql(
            """\
mutation HeartbeatMutation {
  heartbeat {
    isAlive
  }
}
                    """
        )

    async def _send_heartbeat(self):
        return (await self.client.execute(self.query))

    async def main(self):
        while True:
            LOGGER.debug("heartbeat")
            await wrap_log(LOGGER, self._send_heartbeat(), mute_error=True)
            await asyncio.sleep(self.delay)
