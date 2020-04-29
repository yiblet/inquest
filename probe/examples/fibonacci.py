import logging
import logging.config
from time import sleep

from inquest.runner import enable
from inquest.util import LOGGING_CONFIG

# enable logging to see inquest's internal log statemnets
logging.config.dictConfig(LOGGING_CONFIG)
LOGGER = logging.getLogger(__name__)


def fib(value: int):
    if value == 0:
        return 1
    if value == 1:
        return 1
    sleep(0.2)
    return fib(value - 1) + fib(value - 2)


def main():
    try:
        enable(root="..", glob=["examples/**/*.py", "inquest/**/*.py"])
        LOGGER.info("starting the main loop")
        while True:
            fib(20)
    except KeyboardInterrupt:
        LOGGER.info("closing the main loop")


if __name__ == "__main__":
    main()
