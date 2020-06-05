import os

from ..module_tree import ModuleTree


def test_on_probe_test_module():
    tree = ModuleTree(*os.path.split(__file__))
    files = {file.absolute_name for file in tree.modules()}
    assert __file__ in files


def test_on_sample_module():
    sample = os.path.join(os.path.dirname(__file__), "sample.py")
    tree = ModuleTree(os.path.dirname(__file__), "sample.py")
    files = {file.absolute_name: file for file in tree.modules()}
    assert sample in files
    assert set(func.name for func in files[sample].functions) == {
        'sample', 'async_sample', 'sample_with_decorator',
        'async_sample_with_decorator'
    }

    classes = set(cls.name for cls in files[sample].classes)
    methods = set(
        f'{cls.name}.{met.name}' for cls in files[sample].classes
        for met in cls.methods
    )
    assert classes == {'TestClass', 'TestClassWithDecorator'}
    assert methods == {
        'TestClassWithDecorator.async_sample',
        'TestClassWithDecorator.async_sample_with_decorator',
        'TestClassWithDecorator.sample_with_decorator',
        'TestClassWithDecorator.sample',
        'TestClass.async_sample',
        'TestClass.async_sample_with_decorator',
        'TestClass.sample_with_decorator',
        'TestClass.sample',
    }
