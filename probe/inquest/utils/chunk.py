from typing import Iterable, List, TypeVar

A = TypeVar('A')


def chunk(iterable: Iterable[A], size: int) -> Iterable[List[A]]:
    if size <= 0:
        raise ValueError("size must be positive")
    output = []
    for val in iterable:
        output.append(val)
        if len(output) == size:
            yield output
            output = []
    if len(output) != 0:
        yield output
