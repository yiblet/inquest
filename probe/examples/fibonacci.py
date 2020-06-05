import argparse
import logging
import logging.config
from time import sleep

import inquest
from inquest.utils.logging import LOGGING_CONFIG

logging.config.dictConfig(LOGGING_CONFIG)


def fib(value: int):
    if value == 0:
        return 1
    if value == 1:
        return 1
    sleep(0.2)
    return fib(value - 1) + fib(value - 2)


def main():
    inquest.enable(api_key=cli(), glob=["examples/**/*.py"])
    while True:
        fib(20)


def cli():
    parser = argparse.ArgumentParser("inquest example")
    parser.add_argument("-id", type=str)
    return parser.parse_args().id


if __name__ == "__main__":
    main()
