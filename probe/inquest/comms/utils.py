import logging
from typing import Awaitable, Optional, OrderedDict

from gql.transport.exceptions import TransportQueryError


def log_result(logger: logging.Logger, result: OrderedDict):
    logger.debug(
        "backend returned with data",
        extra={
            'data': result,
        },
    )


def log_error(logger: logging.Logger, error: TransportQueryError):
    logger.debug(
        "backend returned with error",
        extra={
            'error': error,
        },
    )


async def wrap_log(
    logger: logging.Logger,
    result: Awaitable[OrderedDict],
    mute_error=False
) -> Optional[OrderedDict]:
    try:
        res = await result
        log_result(logger, res)
        return res
    except TransportQueryError as err:
        log_error(logger, err)
        if not mute_error:
            raise err
        else:
            return None
