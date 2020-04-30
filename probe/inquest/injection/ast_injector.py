from __future__ import annotations

import ast
import dataclasses
from typing import List, Optional
import logging

LOGGER = logging.getLogger(__name__)


@dataclasses.dataclass
class TestStatement:
    lineno: int
    body: Optional[List[List[TestStatement]]] = None


def insert(node: ast.AST, line: int, statement_to_add: ast.AST):
    """
    inserts the new statement_to_add to the given line
    """
    stmts = get_blocks(node)
    if stmts is None:
        return False
    return _modify(node, stmts, line, statement_to_add)


def _modify(
    node: ast.AST,
    stmts: List[List[ast.AST]],
    line: int,
    statement_to_add: ast.AST,
) -> bool:
    max_line = node.lineno
    min_line = node.lineno

    if node.lineno > line:
        return False

    # going forward, node.lineno <= line

    # find last line
    prev = None
    prev_is_valid = False
    found = False
    for idx, statements in enumerate(stmts):
        for statement_idx, statement in enumerate(statements):
            if statement.lineno > line:
                found = True
                break
            max_line = max(max_line, statement.lineno)
            min_line = max(min_line, statement.lineno)

            if statement.lineno == line:
                prev_is_valid = True
            prev = (idx, statement_idx)

        if found:
            break

    if not found and not prev_is_valid:
        # last line occurs before the insertion point
        return False

    if prev is None:  # prev is guarenteed to not be valid
        stmts[0].insert(0, statement_to_add)
        return True

    # now prev must point to the either the target line or the
    # statement before the target line
    block_idx, statement_idx = prev
    cur_statement = stmts[block_idx][statement_idx]

    blocks = get_blocks(cur_statement)
    if cur_statement.lineno == line:
        if blocks is not None:
            # if has blockstatements -> put it in the first line of
            blocks[0].insert(0, statement_to_add)
        else:
            # the first block else put it in the next line
            stmts[block_idx].insert(statement_idx + 1, statement_to_add)
        return True
    if cur_statement.lineno < line:
        if blocks is None or (not insert(
                cur_statement,
                line,
                statement_to_add,
        )):
            # if has blockstatements -> recurse into the statements
            # else (or if previou statement doesn't work) insert
            # the statement into the proceeeding line
            stmts[block_idx].insert(statement_idx + 1, statement_to_add)
        return True
    raise ValueError('unexpected injection failure')


def has_blocks(node: ast.AST):
    return get_blocks(node) is not None


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
