from __future__ import annotations

import ast
import copy
import dataclasses
import logging
from typing import List, Optional, Tuple

LOGGER = logging.getLogger(__name__)


@dataclasses.dataclass
class TestStatement:
    lineno: int
    body: Optional[List[List[TestStatement]]] = None


class ASTInjector:

    def __init__(self, base_ast: ast.AST):
        """
        injector builder class
        WARNING: this will mutate the input ast
        """
        self._ast = copy.deepcopy(base_ast)

    def insert(self, line: int, statement: ast.AST):
        res, nodes = insert(self._ast, line, statement)
        if not res:
            raise ValueError('failed to inject statement')
        return nodes

    def result(self):
        return self._ast


def insert(node: ast.AST, line: int,
           statement_to_add: ast.AST) -> Tuple[bool, ast.AST]:
    """
    inserts the new statement_to_add to the given line, and
    returns whether or not it was successful plus the all the
    function definitions and class definitions along the path
    from the input node to the node with the modification
    in reverse order.
    """
    stmts = get_blocks(node)
    if stmts is None:
        return False, []
    if node.lineno > line:
        return False, []
    res, nodes = _modify(stmts, line, statement_to_add)
    if res and is_definition(node):
        nodes.append(node)
    return res, nodes


def _modify(
    stmts: List[List[ast.AST]],
    line: int,
    statement_to_add: ast.AST,
) -> bool:
    # find last line
    prev = None
    prev_is_valid = False
    found = False
    for idx, statements in enumerate(stmts):
        for statement_idx, statement in enumerate(statements):
            if statement.lineno > line:
                found = True
                break

            if statement.lineno == line:
                prev_is_valid = True
            prev = (idx, statement_idx)

        if found:
            break

    if not found and not prev_is_valid:
        # last line occurs before the insertion point
        return False, []

    if prev is None:  # prev is guarenteed to not be valid
        stmts[0].insert(0, statement_to_add)
        return True, []

    # now prev must point to the either the target line or the
    # statement before the target line
    block_idx, statement_idx = prev
    cur_statement = stmts[block_idx][statement_idx]

    blocks = get_blocks(cur_statement)
    if cur_statement.lineno == line:
        if blocks is not None:
            # if has blockstatements -> put it in the first line of
            blocks[0].insert(0, statement_to_add)
            res = [cur_statement] if is_definition(cur_statement) else []
        else:
            # the first block else put it in the next line
            stmts[block_idx].insert(statement_idx + 1, statement_to_add)
            res = []
        return True, res
    if cur_statement.lineno < line:
        if blocks is not None:
            # if has blockstatements -> recurse into the statements
            insert_success, insert_result = insert(
                cur_statement,
                line,
                statement_to_add,
            )

            if insert_success:
                return insert_success, insert_result
            # else (or if previou statement doesn't work) insert
            # the statement into the proceeeding line
        stmts[block_idx].insert(statement_idx + 1, statement_to_add)
        return True, []
    raise ValueError('unexpected injection failure')


def has_blocks(node: ast.AST):
    return get_blocks(node) is not None


def is_definition(node: ast.AST):
    return isinstance(
        node, (ast.AsyncFunctionDef, ast.FunctionDef, ast.ClassDef)
    )


def get_blocks(node: ast.AST) -> Optional[List[List[ast.AST]]]:
    if isinstance(node, TestStatement):
        res = node.body
    elif isinstance(node, ast.FunctionDef):
        node: ast.FunctionDef = node
        res = [node.body]
    elif isinstance(node, ast.AsyncFunctionDef):
        node: ast.AsyncFunctionDef = node
        res = [node.body]
    elif isinstance(node, ast.ClassDef):
        node: ast.ClassDef = node
        res = [node.body]
    elif isinstance(node, ast.For):
        node: ast.For = node
        res = [node.body, node.orelse]
    elif isinstance(node, ast.AsyncFor):
        node: ast.AsyncFor = node
        res = [node.body, node.orelse]
    elif isinstance(node, ast.While):
        node: ast.While = node
        res = [node.body, node.orelse]
    elif isinstance(node, ast.If):
        node: ast.If = node
        res = [node.body, node.orelse]
    elif isinstance(node, ast.With):
        node: ast.With = node
        res = [node.body]
    elif isinstance(node, ast.AsyncWith):
        node: ast.AsyncWith = node
        res = [node.body]
    elif isinstance(node, ast.Try):
        node: ast.Try = node
        res = [node.body, node.orelse, node.finalbody]
    else:
        res = None
    return res
