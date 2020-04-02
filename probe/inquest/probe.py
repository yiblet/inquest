# import asyncio
import logging
from typing import List, NamedTuple, Optional

from .hotpatch import embed_in_function

LOGGER = logging.getLogger(__name__)


class LogInjection(NamedTuple):
    module: str
    function: str
    statement: str
    error: Optional[Exception] = None
    enabled: bool = True


class Probe:
    logs: List[LogInjection]
    package: str

    def __init__(self, package: str):
        self.package = package
        self.logs = []

    def get_log(self, module, function) -> Optional[LogInjection]:
        for log in self.logs:
            if module == log.module and function == log.function:
                return log
        return None

    def add_log(self, module, function, statement) -> LogInjection:
        if self.get_log(module, function) is not None:
            raise ValueError('that function is already being logged')

        injection = LogInjection(
            module=module,
            function=function,
            statement=statement,
        )
        try:
            embed_in_function(f'{module}:{function}', statement, self.package)
        except ValueError as error:
            injection = LogInjection(
                module=module,
                function=function,
                statement=statement,
                error=error,
                enabled=False,
            )
        self.logs.append(injection)
        return injection

    def remove_log(self, module, function, statement):
        raise NotImplementedError('TODO')
