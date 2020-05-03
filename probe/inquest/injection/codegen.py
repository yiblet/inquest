import ast
import inspect
import re
import types
from typing import List, NamedTuple, Tuple

from inquest.hotpatch import TraceException
from inquest.injection.ast_injector import ASTInjector
from inquest.module_tree import FunctionOrMethod


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
    ast.increment_lineno(func1_ast, func_lineno - 1)
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

    mod = compile(ast.Module(body=[func1_ast]), filename, 'exec')
    return mod.co_consts[0]


def add_log_statements_infer_lineno(
    func1: FunctionOrMethod, statements: List[Tuple[str, str]]
) -> types.CodeType:

    func1 = _unwrap(func1)
    filename = inspect.getfile(func1)
    func1_ast = _get_ast(func1)
    lineno = func1_ast.body[0].lineno - 1
    injector = ASTInjector(func1_ast)
    for statement, id in statements:
        try:
            expr = ast.parse(f'___inquest_logging.log(f"{statement}")').body[0]
            injector.insert(lineno, expr)
        except Exception as exc:
            raise TraceException(id, exc)

    return _inject_and_codegen(injector.result(), filename)


def add_log_statements(
    func1: FunctionOrMethod, traces: List[Trace]
) -> types.CodeType:
    func1 = _unwrap(func1)
    func1_ast = _get_ast(func1)
    filename = inspect.getfile(func1)
    injector = ASTInjector(func1_ast)

    for trace in traces:
        try:
            expr = ast.parse(f'___inquest_logging.log(f"{trace.statement}")')
            injector.insert(trace.lineno, expr.body[0])
        except Exception as exc:
            raise TraceException(trace.id, exc)

    return _inject_and_codegen(injector.result(), filename)
