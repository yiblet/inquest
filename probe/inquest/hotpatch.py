from __future__ import absolute_import

import importlib
import inspect
import types
from functools import lru_cache
from typing import List, Optional, Union

from bytecode import Bytecode, Instr

from inquest.parse_fstring import Segment, generate_sections, parse_fstring


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


def embed_in_function(
        path: str,
        fstring: str,
        package: Optional[str] = None,
        old_code: Optional[types.CodeType] = None,
) -> types.CodeType:
    '''
    embeds a log statment at the path
    @param path: has format '<module_path>:<function_name>'
    @param fstring: must be a valid fstring (see embed_fstring)
    @param package: when resolving the function, it's module is found
                    relative to this package
    @returns: the old code
    @raise ValueError: path does not resolve to a known module
    @raise ValueError: fstring has an invalid format
    '''

    function = get_function_in_module(path, package, stack_depth=2)
    if old_code is None:
        old_code = function.__code__
    function.__code__ = embed_fstring(old_code, fstring)
    return old_code


def _generate_print_instruction(
        load_arguments: List[Instr],
        num_arguments: int = 1,
) -> List[Instr]:
    '''
    @param load_arguments: the list of instructions to load the arguments in
                           for the print function
    @param num_arguments: the number of arguments going into the print function
    @returns: the new instructions with the added call to print
    '''
    return [
        Instr("LOAD_GLOBAL", "print"),
        *load_arguments,
        Instr("CALL_FUNCTION", num_arguments),
        Instr("POP_TOP"),
    ]


def _generate_instructions(code: types.CodeType, fstring: str) -> List[Instr]:
    segments: List[Segment] = parse_fstring(fstring)
    args = code.co_varnames[:code.co_argcount]
    args_set = set(args)
    # generate string literals
    sections = list(generate_sections(fstring, segments))
    valid_segments = [
        (literal in args_set, literal)
        for is_segment, literal in sections
        if is_segment
    ]
    for is_valid_segment, segment in valid_segments:
        if not is_valid_segment:
            raise ValueError(
                f"segment '{segment}' is not valid; segments must "
                + f"be exclusively these argument literals: {tuple(args_set)}"
            )

    instructions = []
    for is_segment, literal in sections:
        if is_segment:
            instructions += [
                Instr('LOAD_FAST', literal),
                Instr('FORMAT_VALUE', 0),
            ]
        else:
            instructions.append(
                Instr(
                    'LOAD_CONST',
                    literal.replace(r"\{", "{").replace(r"\}", "}"),
                )
            )

    instructions.append(Instr("BUILD_STRING", len(sections)))
    instructions = _generate_print_instruction(instructions)
    return instructions


def embed_fstring(code: types.CodeType, fstring: str) -> types.CodeType:
    return embed_fstrings(code, [fstring])


def embed_fstrings(
        code: types.CodeType, fstrings: List[str]
) -> types.CodeType:
    '''
    @param code: the code object to be modified
    @param fstring: must be a valid fstring (see embed_fstring)
                    function parameters may be inserted by adding
                    a '{<param_literal>}'
    @returns: the new bytecode with the print statement
    @raise ValueError: fstring has an invalid format

    ## examples
    >>> def sample(x, y):
    >>>     return x + y
    >>> sample.__code__ = embed_fstring(sample.__code__, "{x},{y}")

    now `sample()`  will behave as if it's code was
    >>> def sample(x, y):
    >>>     print(f'{x},{y}')
    >>>     return x + y

    WARNING fstrings currently do not allow for general python expressions
    within their '{}' insertion points, you may only directly refer to function
    parameter values.
    '''

    instructions = [
        instr for fstring in fstrings
        for instr in _generate_instructions(code, fstring)
    ]
    bytecode: Bytecode = Bytecode.from_code(code)
    bytecode.reverse()
    bytecode.extend(reversed(instructions))
    bytecode.reverse()
    return bytecode.to_code()
