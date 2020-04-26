import logging
import logging.config
from time import sleep

from inquest.runner import enable
from inquest.util import LOGGING_CONFIG

# enable logging to see inquest's internal log statemnets
logging.config.dictConfig(LOGGING_CONFIG)
LOGGER = logging.getLogger(__name__)


def work(value):
    return value + 2


def main():
    try:
        enable(root="..", glob=["examples/**/*.py", "inquest/**/*.py"])
        LOGGER.info("starting the main loop")
        value = 0
        while True:
            value = work(value)
            sleep(1)
    except KeyboardInterrupt:
        LOGGER.info("closing the main loop")


if __name__ == "__main__":
    main()
