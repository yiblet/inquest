from bytecode import Bytecode, Instr
import types
# taken from https://github.com/mpolney/hotpatch (MIT Licesense)


def _make_trampoline(target_func):
    bytecode = Bytecode(
        [
            Instr("LOAD_CONST", target_func),
            Instr("LOAD_FAST", "args"),
            Instr("LOAD_FAST", "kwargs"),
            Instr("CALL_FUNCTION_EX", 1),
            Instr("RETURN_VALUE"),
        ]
    )

    def new_varargs_func():
        def func(*args, **kwargs):
            pass

        return func

    tramp = new_varargs_func()
    bytecode.flags = tramp.__code__.co_flags
    tramp.__code__ = bytecode.to_code()

    return tramp


def _make_compatible(code, func):
    return types.CodeType(
        code.co_argcount,
        code.co_kwonlyargcount,
        code.co_nlocals,
        code.co_stacksize,
        code.co_flags,
        code.co_code,
        code.co_consts,
        code.co_names,
        code.co_varnames,
        code.co_filename,
        code.co_name,
        code.co_firstlineno,
        code.co_lnotab,
        func.__code__.co_freevars,
        code.co_cellvars,
    )


def hotpatch(src, dst):
    """
    hotpatch replaces a function (src) with a function (dst)
    """
    tramp = _make_trampoline(src)
    dst.__code__ = _make_compatible(tramp.__code__, dst)
