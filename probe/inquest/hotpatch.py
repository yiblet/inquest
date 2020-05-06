from __future__ import absolute_import

import importlib
import inspect
import types
from functools import lru_cache
from typing import Union


def convert_relative_import_to_absolute_import(
    import_string: str,
    package: str,
    add_level=False,
):
    if import_string[0] != ".":
        return import_string

    package_path = package.split('.')
    idx = 0

    if add_level:
        import_string = "." + import_string

    for char in import_string[1:]:
        if char == '.':
            package_path.pop()
            idx += 1
        else:
            break

    import_string = import_string[idx + 1:]
    if import_string != "":
        package_path.append(import_string)

    return ".".join(package_path)


@lru_cache(maxsize=128, typed=True)
def _retrieve_module(
    module_name: str,
    package: str,
) -> types.ModuleType:
    '''
    resolves modules relative to packages
    @returns module at module_name (relative to package if imported relatively)
    @raises ValueError module path does not resolve to known module
    '''
    try:
        module = importlib.import_module(module_name, package)
    except (ImportError, ImportWarning):
        raise ValueError(
            f"path: module '{module_name}' relative to '{package}'"
            + " does not resolve to known module"
        )
    if module is None:
        raise ValueError(
            f"path: module '{module.__name__}' relative to '{package}'"
            + " does not resolve to known module"
        )
    return module


@lru_cache(maxsize=512, typed=True)
def _retrieve_function_or_method(
    path: str,
    module: types.ModuleType,
    package: str,
) -> Union[types.FunctionType, types.MethodType]:
    '''
    resolves function names or method names inside modules
    @returns the function at the given module
    @raises ValueError function path does not resolve to known function
    '''
    module_name = module.__name__

    try:
        location = module
        for path_section in path.split('.'):
            location = getattr(location, path_section)
        function = location
    except AttributeError:
        raise ValueError(
            f"path: '{module_name}:{path}' relative to '{package}'"
            + " must resolve to a known function or method"
        )

    if (function is None) or not isinstance(
            function, (types.FunctionType, types.MethodType)):
        raise ValueError(
            f"path: '{module_name}:{path}' relative to '{package}'"
            + " must resolve to a known function or method"
        )
    return function


# by separating out _embed_function from embed_in_function we are now
# able to test the crux of finding the right function's logic more thoroughly
def get_function_in_module(
    path: str,
    package: str,
    stack_depth: int = 1,
) -> Union[types.FunctionType, types.MethodType]:
    '''
    @param path: has format '<module_path>:<function_name>'
    @param package: when resolving the function, it's module is found
                    relative to this package
    @returns: the function
    @raise ValueError: path does not resolve to a known module
    @raise ValueError: fstring has an invalid format
    '''

    # retrieve module and path names
    path_parts = path.split(':')
    if len(path_parts) != 2:
        raise ValueError(
            f"invalid path parameter '{path}' must be of the form "
            + "'<module_path>:<function_name>'"
        )
    module_name, function_name = path_parts

    if package is None:
        frame = inspect.stack()[stack_depth]
        mod = inspect.getmodule(frame[0])
        package = mod.__name__

    # relative modules, you must import relative to the parent
    # package of the calling function so we add an additional '.' to the
    # relative import
    if module_name.startswith('.'):
        # module is a relative import
        module_name = '.' + module_name

    module = _retrieve_module(module_name, package)
    return _retrieve_function_or_method(function_name, module, package)
