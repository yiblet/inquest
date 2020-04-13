import dataclasses
import inspect
import os
import re
import sys

from ..module_tree import ClassInfo, FunctionInfo, ModuleInfo, ModuleTree
from . import embed_fstring_test, probe_test
from .embed_test_module import test_imported_module as embed_test_module
from .probe_test_module import test_imported_module as probe_test_module


def test_on_probe_test_module():
    tree = ModuleTree(__file__)
    modules = {obj.module for obj in tree.modules()}
    assert probe_test_module in modules


def test_source_code_retrieval():

    def assert_lines(loc, module):
        dirname = os.path.dirname(__file__)
        lines = open(f'{dirname}/{loc}').readlines()
        tree_lines = ModuleTree.get_module_source(module)
        assert "".join(lines) == "".join(tree_lines)

    loc = 'probe_test_module/test_imported_module.py'
    assert_lines(loc, probe_test_module)

    loc = 'probe_test.py'
    assert_lines(loc, probe_test)

    loc = 'embed_fstring_test.py'
    assert_lines(loc, embed_fstring_test)


def test_module_info():

    def assert_module(module):
        module_info = ModuleInfo(module=module)
        lines = open(f'{module_info.file}').readlines()
        assert len(lines) == module_info.end_line
        assert 0 == module_info.start_line

        for function in module_info.functions:
            class_name = function.function.__name__
            regex = re.compile(r"(async )?def %s\(" % class_name)
            found = False
            for idx, line in enumerate(lines):
                if regex.match(line):
                    # getsource includes accompanying decorators
                    if idx > 0 and lines[idx - 1].startswith("@"):
                        inc = 0
                    else:
                        inc = 1
                    help_text = "lines do not match on %s" % class_name
                    assert idx + inc == function.start_line, help_text
                    found = True
                    break
            if not found:
                assert False, "match not found %s" % class_name

        for class_info in module_info.classes:
            class_name = class_info.class_object.__name__
            regex = re.compile(r"class %s(\(.*\))?:" % class_name)
            found = False
            for idx, line in enumerate(lines):
                if regex.match(line):
                    # getsource DOES NOT include
                    # accompanying decorators for classes
                    help_text = "lines do not match on %s" % class_name
                    assert idx + 1 == class_info.start_line, help_text
                    found = True
            if not found:
                assert False, "match not found on %s" % class_name

    assert_module(probe_test_module)
    assert_module(probe_test)
    assert_module(embed_fstring_test)
    assert_module(embed_test_module)
    assert_module(sys.modules[__name__])  # test on this module


def test_embed_module():

    module_info = ModuleInfo(module=embed_test_module)
    assert len(module_info.classes) == 2


def test_classes():
    class_info = ClassInfo(class_object=SampleClass)


# test classes


class SampleClass:
    pass


@dataclasses.dataclass
class SampleDataClass:
    test: str
