import json
import logging
from typing import OrderedDict


def log_result(logger: logging.Logger, result: OrderedDict):
    if 'errors' in result:
        logger.warning(
            "backend returned with errors: %s",
            json.dumps(result['errors']),
        )
    if 'data' in result:
        logger.debug(
            "backend returned with data: %s",
            json.dumps(result['data']),
        )
