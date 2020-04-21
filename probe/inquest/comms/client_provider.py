import asyncio
import contextlib
import logging
from typing import List

from gql import AsyncClient
from gql.transport.websockets import WebsocketsTransport

from inquest.comms.client_consumer import ClientConsumer

LOGGER = logging.getLogger(__name__)


class ClientProvider(contextlib.AsyncExitStack):

    def __init__(
        self,
        transport: WebsocketsTransport,
        consumers: List[ClientConsumer],
    ):
        super().__init__()
        self.client: AsyncClient = AsyncClient(retries=3, transport=transport)
        self.consumers = consumers

    async def __aenter__(self):
        await super().__aenter__()
        self.client: AsyncClient = await self.enter_async_context(self.client)
        for consumer in self.consumers:
            consumer.set_client(self.client)
        await asyncio.gather(
            *[
                self.enter_async_context(consumer)
                for consumer in self.consumers
            ], self.client.fetch_schema()
        )
        return self

    async def main(self):
        await asyncio.gather(*[consumer.main() for consumer in self.consumers])
