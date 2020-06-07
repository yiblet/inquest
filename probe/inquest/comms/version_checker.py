import logging

import aiohttp

from inquest.utils.version import VERSION

LOGGER = logging.getLogger(__name__)


class VersionCheckException(Exception):
    pass


async def check_version(url: str):
    async with aiohttp.ClientSession() as session:
        backend_version = await _get_version(session, url)

        backend_semver = _convert_version(backend_version)
        probe_semver = _convert_version(VERSION)

        if len(backend_semver) != 3 or len(probe_semver) != 3:
            raise ValueError("version is invalid semver")

        if backend_semver[0] != probe_semver[0] or backend_semver[
                1] != probe_semver[1]:
            raise VersionCheckException("backend version incompatible")

        if backend_semver[2] != probe_semver[2]:
            LOGGER.warning(
                'minor version mismatch',
                extra={
                    'backend_version': backend_version,
                    'probe_version': VERSION
                }
            )


def _convert_version(version: str):
    return [int(ver) for ver in version.split(".")]


async def _get_version(session: aiohttp.ClientSession, url: str) -> str:
    async with session.get(url) as resp:
        resp: aiohttp.ClientResponse = resp

        if resp.status != 200:
            LOGGER.error(
                "version check failed",
                extra={
                    'status_code': resp.status,
                    'failure_message': (await resp.text())
                }
            )
            raise VersionCheckException('response failed')

        return (await resp.text()).strip()
