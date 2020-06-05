from __future__ import annotations

import ast
import glob
import os
import types
from dataclasses import dataclass
from typing import List, Optional, Union

FunctionOrMethod = Union[types.FunctionType, types.MethodType]


class ParsedAST:

    def encode(self):
        raise NotImplementedError()

    @staticmethod
    def parse(ast_node):
        raise NotImplementedError()


def _get_start_and_end(ast_node: ast.AST):
    start_line = ast_node.lineno + len(ast_node.decorator_list)
    end_line = start_line

    for node in ast.walk(ast_node):
        if not hasattr(node, 'lineno'):
            continue
        end_line = max(node.lineno, end_line)
    return start_line, end_line


@dataclass
class FileInfo(ParsedAST):
    name: str
    absolute_name: str
    lines: int
    functions: List[FunctionInfo]
    classes: List[ClassInfo]

    def encode(self):
        return {
            "functions": [function.encode() for function in self.functions],
            "classes": [classObj.encode() for classObj in self.classes]
        }

    # pylint: disable=arguments-differ
    @staticmethod
    def parse(ast_node: ast.Module, name: str, absolute_name: str, lines: int):
        functions: List[Union[ast.FunctionDef, ast.AsyncFunctionDef]] = [
            FunctionInfo.parse(statement)
            for statement in ast_node.body
            if isinstance(statement, (ast.FunctionDef, ast.AsyncFunctionDef))
        ]

        classes = [
            ClassInfo.parse(statement)
            for statement in ast_node.body
            if isinstance(statement, ast.ClassDef)
        ]
        return FileInfo(
            name=name,
            lines=lines,
            absolute_name=absolute_name,
            functions=functions,
            classes=classes,
        )


@dataclass
class FunctionInfo(ParsedAST):
    name: str
    start_line: int
    end_line: int

    def encode(self):
        return {
            "name": self.name,
            "startLine": self.start_line,
            "endLine": self.end_line,
        }

    @staticmethod
    def parse(ast_node: Union[ast.FunctionDef, ast.AsyncFunctionDef]):
        start_line, end_line = _get_start_and_end(ast_node)
        return FunctionInfo(
            name=ast_node.name,
            start_line=start_line,
            end_line=end_line,
        )


@dataclass
class ClassInfo(ParsedAST):
    name: str
    start_line: int
    end_line: int
    methods: List[FunctionInfo]
    classes: List[ClassInfo]

    def encode(self):
        return {
            "name": self.name,
            "startLine": self.start_line,
            "endLine": self.end_line,
            "methods": [function.encode() for function in self.methods],
            "classes": [cls.encode() for cls in self.classes]
        }

    @staticmethod
    def parse(ast_node: ast.ClassDef):
        methods = [
            FunctionInfo.parse(statement)
            for statement in ast_node.body
            if isinstance(statement, (ast.FunctionDef, ast.AsyncFunctionDef))
        ]

        classes = [
            ClassInfo.parse(statement)
            for statement in ast_node.body
            if isinstance(statement, (ast.ClassDef))
        ]

        start_line, end_line = _get_start_and_end(ast_node)

        return ClassInfo(
            name=ast_node.name,
            start_line=start_line,
            end_line=end_line,
            methods=methods,
            classes=classes,
        )


class ModuleTree:
    """
    resolves the files that need to be sent
    """

    def __init__(
        self,
        root_dir: str,
        glob_str: Union[str, List[str]],
        exclude: Optional[List[str]] = None
    ):
        self.root_dir = root_dir
        self.glob = glob_str
        self.exclude = exclude if exclude is not None else []

    def files(self):

        if isinstance(self.glob, list):
            files = set()
            for glob_str in self.glob:
                files.update(
                    glob.glob(
                        os.path.join(self.root_dir, glob_str), recursive=True
                    )
                )
        else:
            files = set(
                glob.glob(
                    os.path.join(self.root_dir, self.glob), recursive=True
                )
            )
        excludes = set()
        for exc in self.exclude:
            excludes += set(glob.glob(os.path.join(exc), recursive=True))
        return sorted(
            file for file in (files - excludes) if file.endswith('.py')
        )

    def modules(self):
        for file in self.files():
            with open(file) as opened_file:
                ast_node = ast.parse(
                    opened_file.read(),
                    file,
                )
            yield FileInfo.parse(
                ast_node,
                file[len(self.root_dir) + 1:],
                file,
                len(file.splitlines()),
            )
