from typing import List, Tuple

from ..parse_fstring import Segment, generate_sections, parse_fstring


def deepeq(l1: List, l2: List):
    return all(map(lambda tup: tup[0] == tup[1], zip(l1, l2)))


def parse(fstring: str) -> List[str]:
    return [segment.get_segment(fstring) for segment in parse_fstring(fstring)]


def parse_sections(fstring: str) -> List[Tuple[bool, str]]:
    return list(generate_sections(fstring, parse_fstring(fstring)))


def test_parse_fsting_simple():
    assert deepeq(parse_fstring("{x} {y}"),
                  [Segment(start=1, end=2),
                   Segment(start=5, end=6)])


def test_parse_fsting():
    assert parse("") == []
    assert deepeq(parse("{x}"), ["x"])
    assert deepeq(parse("{x} {y}"), ["x", "y"])
    assert deepeq(parse("{x = 2} {y}"), ["x = 2", "y"])
    assert deepeq(parse("{x} {x}"), ["x", "x"])
    assert deepeq(parse("{x}{x}"), ["x", "x"])
    assert deepeq(parse("{x\\}\\{y}"), ["x\\}\\{y"])
    assert deepeq(parse("{'x{'}{y}"), ["'x{'", "y"])
    assert deepeq(parse("{\"\"'x{'}{y}"), ["\"\"'x{'", "y"])
    assert deepeq(parse("{'\"x\"{'}{y}"), ["'\"x\"{'", "y"])


def test_generate_sections():
    assert deepeq(parse_sections("{x}"), [
        (True, "x"),
    ])
    assert deepeq(parse_sections("{x} {y}"), [
        (True, "x"),
        (False, " "),
        (True, "y"),
    ])
    assert deepeq(parse_sections("{x = 2} {y}"), [
        (True, "x = 2"),
        (False, " "),
        (True, "y"),
    ])
    assert deepeq(parse_sections("{x} {x}"), [
        (True, "x"),
        (False, " "),
        (True, "x"),
    ])
    assert deepeq(parse_sections("{x}{x}"), [
        (True, "x"),
        (True, "x"),
    ])
