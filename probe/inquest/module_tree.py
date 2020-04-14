from __future__ import annotations

import inspect
import os
import re
import sys
import types
from dataclasses import dataclass
from typing import Dict, Generator, List, Optional, Union

FunctionOrMethod = Union[types.FunctionType, types.MethodType]


def get_source(x) -> Optional[str]:
    # pylint: disable=all
    try:
        return inspect.getsourcefile(x)
    except:  # noqa E722
        return None


def generate_functions(parent, parent_file: str) -> List[FunctionOrMethod]:
    function_or_method = (types.FunctionType, types.ModuleType)

    def predicate(x):
        return isinstance(
            x,
            function_or_method,
        ) and get_source(x) == parent_file

    return [func[1] for func in inspect.getmembers(parent, predicate)]


class SourceInfo:

    @property
    def source_object(self):
        raise NotImplementedError()

    @property
    def name(self) -> str:
        return self.source_object.__name__

    @property
    def file(self) -> Optional[str]:
        return get_source(self.source_object)

    @property
    def start_line(self) -> Optional[int]:
        return inspect.getsourcelines(self.source_object)[1]

    @property
    def end_line(self) -> Optional[int]:
        block, start_line = inspect.getsourcelines(self.source_object)
        return start_line + len(block)

    def convert_to_gql_input(self) -> Dict:
        raise NotImplementedError()


@dataclass
class ClassInfo(SourceInfo):
    class_object: type  # TODO figure out a more specific type
    parent_module: ModuleInfo

    @property
    def source_object(self):
        return self.class_object

    @property
    def functions(self) -> List[FunctionInfo]:
        return [
            FunctionInfo(function=func, parent_class=self.class_object)
            for func in generate_functions(self.class_object, self.file)
        ]


@dataclass
class FunctionInfo(SourceInfo):
    function: FunctionOrMethod
    parent_module: Optional[ModuleInfo] = None
    parent_class: Optional[type] = None

    @property
    def source_object(self):
        return self.function


@dataclass
class ModuleInfo(SourceInfo):
    module: types.ModuleType

    @property
    def source_object(self):
        return self.module

    @property
    def classes(self) -> List[ClassInfo]:
        test_file = self.file
        return [
            ClassInfo(class_object=obj[1], parent_module=self)
            for obj in inspect.getmembers(
                self.module,
                lambda x: inspect.isclass(x) and get_source(x) == test_file
            )
        ]

    @property
    def functions(self) -> List[FunctionInfo]:
        return [
            FunctionInfo(function=func, parent_module=self)
            for func in generate_functions(self.module, self.file)
        ]


def parent_module_name(name: str):
    idx = name.rfind(".")
    if idx == -1:
        return None

    result = name[:idx]

    if re.match(r'\.+', result):
        return None

    return result


def convert_function_info(function: FunctionInfo):
    return {
        "name": function.name,
        "startLine": function.start_line,
        "endLine": function.end_line,
    }


def convert_class_info(cls: ClassInfo):
    return {
        "name":
            cls.name,
        "startLine":
            cls.start_line,
        "endLine":
            cls.end_line,
        "methods":
            [convert_function_info(function) for function in cls.methods],
    }


def convert_module_info(module: ModuleInfo, file_id: str):
    res = {
        "name": module.name,
        "childFunctions":
            [convert_function_info(function) for function in module.functions],
        "childClasses": [convert_class_info(cls) for cls in module.classes],
        "fileId": file_id,
        "lines": module.end_line,
    }
    parent = parent_module_name(module.name)
    if parent:
        res['parentModuleName'] = parent
    return res


# TODO bug: this method is unable to find unimported modules
class ModuleTree:

    def __init__(self, root_path: str):
        if not os.path.isdir(root_path):
            root_path = os.path.dirname(root_path)
        self.root_path = root_path

    def modules(self) -> Generator[ModuleInfo, None, None]:
        for module in list(sys.modules.values()):
            if getattr(module, "__file__", None):
                if not module.__file__.startswith(self.root_path):
                    continue
                yield ModuleInfo(module=module)

    @staticmethod
    def get_module_source(module: types.ModuleType) -> Optional[str]:
        """
        get_module_source
        @param module: the module
        returns a string if it was able to retrieve the module's source
        """
        try:
            return inspect.getsourcelines(module)[0]
        except OSError:
            return None
