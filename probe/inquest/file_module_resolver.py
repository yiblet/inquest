import logging
import os
import sys

LOGGER = logging.getLogger(__name__)


def get_root_dir():
    root_dir = os.path.abspath(os.getcwd())
    python_paths = set(os.path.abspath(path) for path in sys.path)
    if root_dir not in python_paths:
        raise ValueError("root %s is not in python path" % root_dir)
    return root_dir


class FileModuleResolverException(Exception):

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class FileModuleResolver:
    """
    resolves filenames to module names
    the logic:
        root defines the maximum subdirectory that can be imported from
    """

    def __init__(self, package: str):
        self.root_dir = get_root_dir()

        main = os.path.abspath(sys.modules[package].__file__)
        if not main.startswith(self.root_dir):
            raise ValueError(
                "current calling module %s is not inside of root" % package
            )

        self.main = main[len(self.root_dir) + 1:]
        LOGGER.debug("main is %s", self.main)

    def convert_filename_to_modulename(self, filename: str) -> str:

        if filename == self.main:
            return "__main__"
        if filename.endswith("/__init__.py"):
            # python file is a __init__.py
            modname = filename[:-len("/__init__.py")]
            modname = modname.replace("/", ".")
        elif filename.endswith(".py"):
            # filename is a normal python file
            modname = filename[:-len(".py")]
            modname = modname.replace("/", ".")
        else:
            raise ValueError("file %s is not a python file" % filename)

        LOGGER.debug(
            "converting filename",
            extra={
                "input_filename": filename,
                "output_modulename": modname
            },
        )

        if sys.modules.get(modname) is None:
            raise FileModuleResolverException(
                "could not find module %s for file %s with given root %s" %
                (modname, filename, self.root_dir)
            )

        return modname
