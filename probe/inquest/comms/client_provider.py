import asyncio
import base64
import contextlib
import copy
import logging
from typing import Dict, List, Optional

from gql import AsyncClient, gql
from gql.transport.websockets import WebsocketsTransport

from inquest.comms.client_consumer import ClientConsumer

LOGGER = logging.getLogger(__name__)


class ClientProvider(contextlib.AsyncExitStack):

    def __init__(
        self,
        *,
        trace_set_key: str,
        url: str,
        consumers: List[ClientConsumer],
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__()
        self.url = url
        self.consumers: List[ClientConsumer] = consumers
        self.headers = copy.copy(headers) if headers is not None else dict()
        self.trace_set_key = trace_set_key
        self.client = None

        self.query = gql(
            """\
mutation NewProbeMutation($traceSetKey: String!) {
  newProbe(traceSetKey: $traceSetKey) {
    key
  }
}
                    """
        )

    async def login(self):
        authorization = 'Authorization'
        if 'Authorization' not in self.headers:
            async with AsyncClient(retries=3, transport=WebsocketsTransport(
                    url=self.url,
                    ssl=None,
                    headers=self.headers,
            )) as client:
                result = (
                    await client.execute(
                        self.query,
                        variable_values={'traceSetKey': self.trace_set_key}
                    )
                ).to_dict()
                if 'errors' in result:
                    raise Exception('failed to connect')
                key = str(result['data']['newProbe']['key'])
                result = base64.b64encode(f'probe_{key}:'.encode('utf8'))

            value = f'Basic {result.decode("utf8")}'
            self.headers[authorization] = value
            LOGGER.debug('logged in')

    async def __aenter__(self):
        await super().__aenter__()
        await self.login()
        self.client: AsyncClient = await self.enter_async_context(
            AsyncClient(
                retries=3,
                transport=WebsocketsTransport(
                    url=self.url,
                    ssl=None,
                    headers=self.headers,
                )
            )
        )
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
