import ast
import inspect
import logging
import re
import sys
import types
from typing import List, NamedTuple

from inquest.injection.ast_injector import ASTInjector
from inquest.module_tree import FunctionOrMethod
from inquest.utils.exceptions import ProbeException

LOGGER = logging.getLogger(__name__)


class Trace(NamedTuple):
    lineno: int
    statement: str
    id: str


def _unwrap(func: FunctionOrMethod):
    while hasattr(func, '__wrapped__'):
        func = func.__wrapped__
    return func


def _dedent_if_necessary(lines):
    if len(lines) == 0:
        return lines

    match = re.match(r'^(?P<dedent>\s*)', lines[0])
    num_dedent_chars = len(match.group('dedent'))
    if num_dedent_chars == 0:
        return lines
    return [line[num_dedent_chars:] for line in lines]


def _get_ast(func1: FunctionOrMethod):
    func1 = _unwrap(func1)
    source_lines, func_lineno = inspect.getsourcelines(func1)
    source = "".join(_dedent_if_necessary(source_lines))

    ast_module = ast.parse(source)
    func1_ast: ast.FunctionDef = ast_module.body[0]
    func1_ast = ast.increment_lineno(func1_ast, func_lineno - 1)
    return func1_ast


def _inject_and_codegen(func1_ast: ast.AST, filename):
    func1_ast.body.insert(
        0,
        ast.Import(
            lineno=func1_ast.body[0].lineno,
            col_offset=func1_ast.body[0].col_offset,
            names=[
                ast.alias(name='inquest.logging', asname='___inquest_logging')
            ],
        ),
    )

    # python 3.8 introduced type_ignores into ast.Module
    if sys.version_info[0:2] >= (3, 8):
        mod = compile(
            ast.Module(body=[func1_ast], type_ignores=[]), filename, 'exec'
        )
    else:
        mod = compile(ast.Module(body=[func1_ast]), filename, 'exec')

    for obj in mod.co_consts:
        if isinstance(obj, types.CodeType):
            return obj
    raise Exception('failed to generate the new bytecode')


def add_log_statements(
    func1: FunctionOrMethod, traces: List[Trace]
) -> types.CodeType:
    LOGGER.debug('adding log statements to %s with traces %s', func1, traces)

    func1 = _unwrap(func1)
    func1_ast = _get_ast(func1)
    filename = inspect.getfile(func1)
    injector = ASTInjector(func1_ast)

    for trace in traces:
        try:
            expr = ast.parse(
                '''\
try:
    ___inquest_logging.log(f"{statement}")
except Exception as exc:
    ___inquest_logging.error("{id}", exc)
'''.format(statement=trace.statement, id=trace.id)
            )

            for node in ast.walk(expr):
                if hasattr(node, 'lineno'):
                    node.lineno = int(trace.lineno)

            injector.insert(trace.lineno, expr.body[0])
        except Exception as exc:
            raise ProbeException(message=str(exc), trace_id=trace.id) from exc

    return _inject_and_codegen(injector.result(), filename)
