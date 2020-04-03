# import asyncio
import logging
import types
from typing import NamedTuple, Optional, Set

from inquest.hotpatch import embed_in_function, get_function_in_module

LOGGER = logging.getLogger(__name__)


class LogInjection(NamedTuple):
    module: str
    function: str
    statement: str
    original_code: types.CodeType
    error: Optional[Exception] = None
    enabled: bool = True


class Probe:
    logs: Set[LogInjection]
    package: str

    def __init__(self, package: str):
        self.package = package
        self.logs = set()

    def get_log(self, module, function) -> Optional[LogInjection]:
        for log in self.logs:
            if module == log.module and function == log.function:
                return log
        return None

    @staticmethod
    def get_path(module, function):
        return f'{module}:{function}'

    def revert_log(self, module: str, function: str) -> bool:
        injection = self.get_log(module, function)
        if injection is not None:
            function = get_function_in_module(
                self.get_path(module, function),
                self.package,
            )
            function.__code__ = injection.original_code
            self.logs.remove(injection)
            return True
        return False

    def upsert_log(
            self,
            module: str,
            function: str,
            statement: str,
    ) -> LogInjection:
        # then add the new log statement
        previous_injection = self.get_log(module, function)

        if previous_injection is not None:
            original_code = previous_injection.original_code
        else:
            original_code = get_function_in_module(
                self.get_path(module, function),
                self.package,
            ).__code__

        injection = LogInjection(
            module=module,
            function=function,
            statement=statement,
            original_code=original_code,
        )

        try:
            embed_in_function(
                path=self.get_path(module, function),
                fstring=statement,
                package=self.package,
                old_code=original_code,
            )
            if previous_injection is not None:
                self.logs.remove(previous_injection)
        except ValueError as error:
            injection = LogInjection(
                module=module,
                function=function,
                statement=statement,
                original_code=original_code,
                error=error,
                enabled=False,
            )

        self.logs.add(injection)

        return injection
