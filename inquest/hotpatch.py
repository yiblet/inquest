import importlib
import inspect
import types
from typing import List, Optional

from bytecode import Bytecode, Instr

from .parse_fstring import Segment, generate_sections, parse_fstring


def embed_in_function(path: str,
                      fstring: str,
                      package: Optional[str] = None) -> None:
    '''
    @param path: has format '<module_path>:<function_name>'
    @param fstring: must be a valid fstring (see embed_fstring)
    @param package: when resolving the function, it's module is found
                    relative to this package
    @returns: Nothing, this function embeds instructions
              into the function and modifies it in place
    @raise ValueError: path does not resolve to a known module
    @raise ValueError: fstring has an invalid format

    TODO examples
    '''

    # retrieve module and path names
    path_parts = path.split(':')
    if len(path_parts) != 2:
        raise ValueError("invalid path parameter must be of the form "
                         + "'<module_path>:<function_name>'")
    module_name, function_name = path_parts

    if package is None:
        frame = inspect.stack()[1]
        mod = inspect.getmodule(frame[0])
        package = mod.__name__

        # TODO in relative modules, you must import relative to the parent
        # package of the calling function so we add an additional '.' to the
        # relative import
        if module_name.startswith('.'):
            # module is a relative import
            module_name = '.' + module_name

    try:
        module = importlib.import_module(module_name, package)
    except (ImportError, ImportWarning):
        raise ValueError("path does not resolve to known module")

    try:
        function = getattr(module, function_name)
    except AttributeError:
        raise ValueError('path does not resolve to known function')

    if not isinstance(function, (types.FunctionType, types.MethodType)):
        raise ValueError('path must resolve to a function or a method')

    function.__code__ = embed_fstring(function.__code__, fstring)


def _generate_print_instruction(load_arguments: List[Instr],
                                num_arguments: int = 1) -> List[Instr]:
    '''
    param load_arguments: the list of instructions to load the arguments in for
                          the print function
    param num_arguments: the number of arguments going into the print function
    returns: the new instructions with the added call to print
    '''
    return [
        Instr("LOAD_GLOBAL", "print"),
        *load_arguments,
        Instr("CALL_FUNCTION", num_arguments),
        Instr("POP_TOP"),
    ]


def embed_fstring(code: types.CodeType, fstring: str) -> types.CodeType:
    '''
    @param code: the code object to be modified
    @param fstring: must be a valid fstring (see embed_fstring)
                    function parameters may be inserted by adding
                    a '{<param_literal>}'
    @returns: Nothing, this function embeds instructions
              into the function and modifies it in place
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
    segments: List[Segment] = parse_fstring(fstring)
    args = code.co_varnames[:code.co_argcount]
    args_set = set(args)
    # generate string literals
    sections = list(generate_sections(fstring, segments))
    valid_segments = [(literal in args_set, literal)
                      for is_segment, literal in sections
                      if is_segment]
    for is_valid_segment, segment in valid_segments:
        if not is_valid_segment:
            raise ValueError(f"segment {segment} is not valid; segments must "
                             + "be exclusively argument literals")

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
                ))

    instructions.append(Instr("BUILD_STRING", len(sections)))

    instructions = _generate_print_instruction(instructions)

    bytecode: Bytecode = Bytecode.from_code(code)
    bytecode.reverse()
    bytecode.extend(reversed(instructions))
    bytecode.reverse()
    return bytecode.to_code()
