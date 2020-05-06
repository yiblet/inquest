from __future__ import annotations

import contextlib
from typing import Set

# flake8: noqa

_CALL_BACKS: Set[Callback] = set()


class Callback:

    def log(self, value: str):
        raise NotImplementedError()

    def error(self, trace_id: str, value: Exception):
        raise NotImplementedError()


class PrintCallback(Callback):

    def log(self, value: str):
        print(value)

    def error(self, trace_id: str, value: Exception):
        pass


def log(value):
    # pylint: disable=all
    for callback in _CALL_BACKS:
        try:
            callback.log(value)
        except:
            pass


def error(id: str, value):
    # pylint: disable=all
    for callback in _CALL_BACKS:
        try:
            callback.error(id, value)
        except:
            pass


def add_callback(value):
    _CALL_BACKS.add(value)


def remove_callback(value):
    _CALL_BACKS.remove(value)


@contextlib.contextmanager
def with_callback(callback):
    add_callback(callback)
    try:
        yield None
    finally:
        remove_callback(callback)
