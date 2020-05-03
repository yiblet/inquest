import contextlib


class HasStack:
    """
    Utility class to run a an ExitStack in the background
    """

    def __init__(self):
        self._stack = contextlib.ExitStack()

    def __enter__(self):
        self._stack.__enter__()
        self.enter()
        return self

    def enter(self):
        """
        this defines the context dependencies and what
        needs to be destructured on exit
        """
        raise NotImplementedError('not implemented')

    def __exit__(self, *exc_details):
        return self._stack.__exit__(*exc_details)
