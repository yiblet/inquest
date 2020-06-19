import contextlib
import hashlib
import logging
import urllib
from typing import AsyncGenerator, Iterable, List, Tuple

import aiohttp
from inquest.utils.chunk import chunk

LOGGER = logging.getLogger(__name__)
_MAX_OPEN_FDS = 64


def _hash_file(filename: str) -> str:
    max_single_read_size = 1000 * 1000
    md5_hash = hashlib.md5()
    with open(filename, "rb") as hashfile:
        line = hashfile.read(max_single_read_size)
        while line != b"":
            md5_hash.update(line)
            line = hashfile.read(max_single_read_size)
    return md5_hash.hexdigest()


class FileSenderException(Exception):
    pass


class FileSender(contextlib.AsyncExitStack):

    def __init__(self, url=str):
        self.url = url
        self.session: aiohttp.ClientSession = None
        super().__init__()

    async def __aenter__(self):
        await super().__aenter__()
        self.session = await self.enter_async_context(aiohttp.ClientSession())
        return self

    async def check_hashes(
        self, trace_set_id: str, filenames: Iterable[Tuple[str, str]]
    ) -> List[str]:
        get_absolute_name = dict(filenames)
        data = {
            filename: _hash_file(absolute_name)
            for filename, absolute_name in get_absolute_name.items()
        }
        trace_set_slug = urllib.parse.quote(trace_set_id)
        async with self.session.post(
                self.url + f"/{trace_set_slug}/check",
                data=data,
        ) as resp:
            if resp.status != 200:
                LOGGER.error(
                    "checking failed",
                    extra={
                        "status_code": resp.status,
                        "failure_message": (await resp.text()),
                    },
                )
                raise FileSenderException("checking failed")

            resp = await resp.json()
            if not isinstance(resp, list):
                raise FileSenderException("backend didn't respond with a list")

            return resp

    async def send_files(
        self, *, trace_set_id: str, filenames: Iterable[Tuple[str, str]]
    ) -> AsyncGenerator[Tuple[str, str], None]:
        """
        sends the files to the backend
        outputs a generator of tuples containing (filename, file_id)
        """
        # chunking the files into groups of 64 to prevent too many fds from
        # being opened at once
        for filename_chunk in chunk(filenames, _MAX_OPEN_FDS):

            get_absolute_name = dict(filename_chunk)
            trace_set_slug = urllib.parse.quote(trace_set_id)

            with aiohttp.MultipartWriter('form-data') as writer:
                for filename, absolute_name in get_absolute_name.items():
                    part = writer.append(open(absolute_name, 'rb'))
                    part.set_content_disposition(
                        'form-data', name=filename, filename=filename
                    )
                    LOGGER.debug(
                        "sending file",
                        extra={
                            "absolute_name": absolute_name,
                            "relative_name": filename,
                            "relative_name_length": len(filename),
                        },
                    )

            async with self.session.post(
                    self.url + f"/{trace_set_slug}/send",
                    data=writer,
            ) as resp:
                resp: aiohttp.ClientResponse = resp
                if resp.status != 200:
                    LOGGER.error(
                        "sending failed",
                        extra={
                            "status_code": resp.status,
                            "failure_message": (await resp.text()),
                        },
                    )
                    raise FileSenderException("sending failed")
                for item in (await resp.json()).items():
                    yield item
