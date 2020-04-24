import asyncio
import json
import logging

from gql import gql

from inquest.comms.client_consumer import ClientConsumer

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

    async def main(self):
        while True:
            LOGGER.debug("heartbeat")
            result = (await self.client.execute(self.query)).to_dict()
            if 'errors' in result:
                LOGGER.warning(
                    "backend returned with errors: %s",
                    json.dumps(result['errors']),
                )
            await asyncio.sleep(self.delay)
