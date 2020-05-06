import contextlib

from gql import AsyncClient


class ClientConsumer(contextlib.AsyncExitStack):
    # whether or not this consumer needs to be run at initialization
    initialization = False

    def __init__(self):
        super().__init__()
        self._client = None

    def set_client(self, client: AsyncClient):
        self._client = client

    @property
    def client(self) -> AsyncClient:
        if self._client is None:
            raise ValueError('consumer wasn\'t given asccess to the client')
        return self._client

    async def main(self):
        raise NotImplementedError()
