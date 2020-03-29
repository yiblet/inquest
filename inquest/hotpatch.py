import types
from typing import List

from bytecode import Bytecode, Instr

from .parse_fstring import Segment, generate_sections, parse_fstring


def generate_print_instruction(load_arguments: List[Instr]) -> List[Instr]:
    return [
        Instr("LOAD_GLOBAL", "print"),
        *load_arguments,
        Instr("CALL_FUNCTION", 1),
        Instr("POP_TOP"),
    ]


def embed_fstring(code: types.CodeType, fstring: str) -> types.CodeType:
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

    instructions = generate_print_instruction(instructions)

    bytecode: Bytecode = Bytecode.from_code(code)
    bytecode.reverse()
    bytecode.extend(reversed(instructions))
    bytecode.reverse()
    return bytecode.to_code()
