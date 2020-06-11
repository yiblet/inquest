import contextlib

from gql import Client


class ClientConsumer(contextlib.AsyncExitStack):
    # whether or not this consumer needs to be run at initialization
    initialization = False

    def __init__(self):
        super().__init__()
        self._client = None
        self._trace_set_id = None

    def _set_values(self, client: Client, trace_set_id: str):
        self._client = client
        self._trace_set_id = trace_set_id

    @property
    def trace_set_id(self) -> str:
        if self._trace_set_id is None:
            raise ValueError('consumer wasn\'t given asccess to the client')
        return self._trace_set_id

    @property
    def client(self) -> Client:
        if self._client is None:
            raise ValueError('consumer wasn\'t given asccess to the client')
        return self._client

    async def main(self):
        raise NotImplementedError()
