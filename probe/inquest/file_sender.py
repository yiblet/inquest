import contextlib
import logging
from typing import Dict

import aiohttp

LOGGER = logging.getLogger(__name__)


class FileSender(contextlib.AsyncExitStack):

    def __init__(self, url=str):
        self.url = url
        self.session: aiohttp.ClientSession = None
        super().__init__()

    async def __aenter__(self):
        await super().__aenter__()
        self.session = await self.enter_async_context(aiohttp.ClientSession())
        return self

    async def send_file(self, filename: str) -> Dict:
        LOGGER.debug("sending file %s", filename)
        data = {'data': open(filename, 'rb')}
        async with self.session.post(self.url, data=data) as resp:
            resp: aiohttp.ClientResponse = resp
            if resp.status != 200:
                LOGGER.error(
                    "sending failed with a status code: %s, with text %s",
                    resp.status, await resp.text()
                )

            return await resp.json()
