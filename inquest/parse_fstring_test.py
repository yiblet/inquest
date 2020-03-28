from typing import List
from .parse_fstring import parse_fstring


def deepeq(l1: List, l2: List):
    return all(map(lambda tup: tup[0] == tup[1], zip(l1, l2)))


def parse(fstring: str) -> List[str]:
    return [segment.get_segment(fstring) for segment in parse_fstring(fstring)]


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
