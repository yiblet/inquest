import logging
import types
from typing import Dict

from inquest.module_tree import FunctionOrMethod
from inquest.utils.has_stack import HasStack

LOGGER = logging.getLogger(__name__)


class CodeReassigner(HasStack):

    def __init__(self):
        super().__init__()
        self._functions: Dict[FunctionOrMethod, types.CodeType] = {}

    def enter(self):
        self._stack.callback(self.revert_all)

    def original_code(self, func: FunctionOrMethod):
        if func not in self._functions:
            raise ValueError('function was not assigned')
        return self._functions[func]

    def assign_function(self, func: FunctionOrMethod, code: types.CodeType):
        LOGGER.debug(
            'assigning to function', extra={'function': func.__name__}
        )
        if func not in self._functions:
            self._functions[func] = func.__code__
        func.__code__ = code

    def revert_function(self, func: FunctionOrMethod):
        LOGGER.debug('reverting function', extra={'function': func.__name__})
        if func not in self._functions:
            raise ValueError('function was not assigned')
        func.__code__ = self._functions[func]

    def revert_all(self):
        for func in self._functions:
            self.revert_function(func)
