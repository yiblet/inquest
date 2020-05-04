import types

import inquest.injection.codegen as codegen


class FakeCodeReassigner:

    def assign_function(self, func, code: types.CodeType):
        if func not in self._functions:
            self._functions[func] = func.__code__
        func.__code__ = code


def assign_function(self, func, code: types.CodeType):
    if func not in self._functions:
        self._functions[func] = func.__code__
    func.__code__ = code


def test_on_code_reassigner(capsys):
    result = codegen.add_log_statements(
        FakeCodeReassigner.assign_function,
        [codegen.Trace(lineno=9, statement="test", id="test")]
    )
    assert isinstance(result, types.CodeType)


def test_on_basic_assign_function(capsys):
    result = codegen.add_log_statements(
        assign_function,
        [codegen.Trace(lineno=14, statement="test", id="test")]
    )
    assert isinstance(result, types.CodeType)
