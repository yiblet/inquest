from typing import Iterator, List, NamedTuple, Tuple

# take from https://github.com/mpolney/hotpatch (MIT Licesense)
# for inspiration

_OUTSIDE_STRING = 0
_IN_QUOTE_STRING = 1
_IN_DOUBLE_QUOTE_STRING = 2

__all__ = ["parse_fstring", "Segment", "generate_sections"]


class Segment(NamedTuple):
    start: int  # inclusive
    end: int  # exclusive

    def get_segment(self, fstring: str) -> str:
        return fstring[self.start:self.end]


def _parse_inside_block(fstring: str) -> str:
    """parses inside {} of an fstring"""
    prev = None
    state = _OUTSIDE_STRING
    open_stack = 0
    exit_length = -1  # location of the final '}'
    for idx, char in enumerate(fstring):
        if state == _OUTSIDE_STRING:
            # case outside_string
            if prev != "\\" and char == "'":
                state = _IN_QUOTE_STRING
            elif prev != "\\" and char == '"':
                state = _IN_DOUBLE_QUOTE_STRING
            elif prev != "\\" and char == "{":
                open_stack += 1
            elif prev != "\\" and char == "}":
                open_stack -= 1
                if open_stack == 0:
                    exit_length = idx
                    break
        elif state == _IN_QUOTE_STRING:
            if prev != "\\" and char == "'":
                state = _OUTSIDE_STRING
        elif state == _IN_DOUBLE_QUOTE_STRING:
            if prev != "\\" and char == '"':
                state = _OUTSIDE_STRING
        prev = char
    if exit_length == -1:
        raise ValueError(
            "invalid fstring argument, it doesn't contain a closing '}'")
    return exit_length


def generate_sections(fstring: str,
                      segments: List[Segment]) -> Iterator[Tuple[bool, str]]:
    if len(segments) == 0:
        yield (False, fstring)
        return

    idx = 1
    literal = fstring[:segments[0].start - 1]
    if len(literal) != 0:
        yield (False, literal)

    yield (True, segments[0].get_segment(fstring))

    while idx < len(segments):
        literal = fstring[segments[idx - 1].end + 1:segments[idx].start - 1]
        if len(literal) != 0:
            yield (False, literal)
        yield (True, segments[idx].get_segment(fstring))
        idx += 1

    literal = fstring[segments[-1].end + 1:]
    if len(literal) != 0:
        yield (False, literal)


def parse_fstring(fstring: str) -> List[Segment]:
    """parses fstrings to reveal internal arguments"""
    # psuedo code:
    #   1. find the first not escaped '{'
    #   2. look for the completing '}'
    #   3. append to substring and recurse onto step 1
    args = []
    cursor = 0
    while cursor >= 0:
        found = fstring.find("{", cursor)
        if found == -1:
            # finished the string
            return args
        if found != 0 and fstring[found - 1] == "\\":
            # the '{' was escaped
            cursor = found + 1
        else:
            # the '{' is valid
            # find the closing '}'
            exit_length = _parse_inside_block(fstring[found:])
            args.append(Segment(start=found + 1, end=found + exit_length))
            cursor = found + (args[-1].end - args[-1].start) + 2
    return args
