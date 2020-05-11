import logging
import logging.config
from time import sleep

from inquest.runner import enable
from inquest.utils.logging import LOGGING_CONFIG

# enable logging to see inquest's internal log statemnets
logging.config.dictConfig(LOGGING_CONFIG)
LOGGER = logging.getLogger(__name__)


def work(value):
    return value + 2


def main():
    try:
        enable(root="..", glob=["examples/**/*.py", "inquest/**/*.py"])
        value = 0
        while True:
            value = work(value)
            sleep(1)
    except KeyboardInterrupt:
        print('closing the main loop')


if __name__ == "__main__":
    main()
