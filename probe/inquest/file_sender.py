import contextlib
import logging
import urllib
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

    async def send_file(
        self, *, relative_name: str, filename: str, trace_set_id: str
    ) -> Dict:
        LOGGER.debug(
            "sending file",
            extra={
                'absolute_name': filename,
                'relative_name': relative_name,
                'relative_name_length': len(relative_name)
            }
        )
        data = {'data': open(filename, 'rb')}

        trace_set_slug = urllib.parse.quote(trace_set_id)
        file_slug = urllib.parse.quote(relative_name, safe='')
        async with self.session.post(
                self.url + f"/{trace_set_slug}/{file_slug}",
                data=data,
        ) as resp:
            resp: aiohttp.ClientResponse = resp
            if resp.status != 200:
                LOGGER.error(
                    "sending failed",
                    extra={
                        'status_code':
                            resp.status,
                        'sent_filename':
                            filename,
                        'relative_name_length':
                            len(relative_name),
                        'failure_message':
                            (await
                             resp.json()).get('message', 'message missing')
                    }
                )

            return await resp.json()
