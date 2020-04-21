import contextlib

# flake8: noqa

_CALL_BACKS = set()


def log(value):
    # pylint: disable=all
    print(value)
    for callback in _CALL_BACKS:
        try:
            callback(value)
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
