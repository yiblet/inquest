import argparse
import logging
import logging.config
from time import sleep

import inquest
from inquest.utils.logging import LOGGING_CONFIG

logging.config.dictConfig(LOGGING_CONFIG)


def work(value):
    return value + 2


def main():
    inquest.enable(api_key=cli(), glob=["examples/**/*.py"])
    value = 0
    while True:
        sleep(0.2)
        value = work(value)


def cli():
    parser = argparse.ArgumentParser("inquest example")
    parser.add_argument("-id", type=str)
    return parser.parse_args().id


if __name__ == "__main__":
    main()
