from time import sleep

from ..main import enable


def work(x):
    return x + 2


def main():
    enable()
    value = 0
    while True:
        value = work(value)
        sleep(1)


if __name__ == "__main__":
    main()
