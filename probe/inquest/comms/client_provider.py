import asyncio
import base64
import contextlib
import copy
import logging
from typing import Dict, List, Optional

from gql import Client, gql
from gql.transport.websockets import WebsocketsTransport
from inquest.comms.client_consumer import ClientConsumer

LOGGER = logging.getLogger(__name__)


class ClientProvider(contextlib.AsyncExitStack):

    def __init__(
        self,
        *,
        trace_set_id: str,
        url: str,
        ssl: bool,
        consumers: List[ClientConsumer],
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__()
        self.url = url
        self.consumers: List[ClientConsumer] = consumers
        self.headers = copy.copy(headers) if headers is not None else dict()
        self.ssl = ssl
        self.trace_set_id = trace_set_id
        self.client = None

        self.query = gql(
            """\
mutation NewProbeMutation($traceSetId: String!) {
  newProbe(traceSetId: $traceSetId) {
    id
  }
}
                    """
        )

    async def login(self):
        authorization = 'Authorization'
        if 'Authorization' not in self.headers:
            async with Client(transport=WebsocketsTransport(
                    url=self.url,
                    ssl=self.ssl,
                    headers=self.headers,
            )) as client:
                result = (
                    await client.execute(
                        self.query,
                        variable_values={'traceSetId': self.trace_set_id}
                    )
                )
                id = str(result['newProbe']['id'])
                result = base64.b64encode(f'probe_{id}:'.encode('utf8'))

            value = f'Basic {result.decode("utf8")}'
            self.headers[authorization] = value
            LOGGER.debug('logged in')

    async def __aenter__(self):
        await super().__aenter__()
        await self.login()
        self.client: Client = await self.enter_async_context(
            Client(
                transport=WebsocketsTransport(
                    url=self.url,
                    ssl=self.ssl,
                    headers=self.headers,
                )
            )
        )
        for consumer in self.consumers:
            consumer._set_values(self.client, self.trace_set_id)
        await asyncio.gather(
            *[
                self.enter_async_context(consumer)
                for consumer in self.consumers
            ], self.client.fetch_schema()
        )
        return self

    async def main(self):
        # first run and complete the initialization consumers
        await asyncio.gather(
            *[
                consumer.main()
                for consumer in self.consumers
                if consumer.initialization
            ]
        )

        # then run and complete the main consumers
        await asyncio.gather(
            *[
                consumer.main()
                for consumer in self.consumers
                if not consumer.initialization
            ]
        )
