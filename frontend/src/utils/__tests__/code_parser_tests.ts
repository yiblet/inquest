import { CodeParser } from "../code_parser";

it("simple code test", function () {
    const code = `import logging
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
        enable()
        LOGGER.info("starting the main loop")
        value = 0
        while True:
            value = work(value)
            sleep(1)
    except KeyboardInterrupt:
        LOGGER.info("closing the main loop")


if __name__ == "__main__":
    main()
    `;

    const parser = new CodeParser(code);
    expect(parser.newLineIdxs).toMatchSnapshot();
    expect(parser.findFunctions()).toMatchObject([
        { line: 13, name: "work" },
        { line: 17, name: "main" },
    ]);

    expect(parser.findClasses()).toMatchObject([]);
});

it("first line code test", function () {
    const code = `def work(value):
    return value + 2`;

    const parser = new CodeParser(code);
    expect(parser.newLineIdxs).toMatchSnapshot();
    expect(parser.findFunctions()).toMatchObject([{ line: 1, name: "work" }]);
    expect(parser.findClasses()).toMatchObject([]);
});

it("weird name test", function () {
    const code = `def Work(value):
    return value + 2`;

    const parser = new CodeParser(code);
    expect(parser.newLineIdxs).toMatchSnapshot();
    expect(parser.findFunctions()).toMatchObject([{ line: 1, name: "Work" }]);
    expect(parser.findClasses()).toMatchObject([]);
});

it("multiple lines", function () {
    const code = `def work(value):
def last(haha):
def friction(hehe)
`;

    const parser = new CodeParser(code);
    const res = parser.findFunctions();
    expect(res).toMatchObject([
        { line: 1, name: "work" },
        { line: 2, name: "last" },
        { line: 3, name: "friction" },
    ]);
    expect(parser.findClasses()).toMatchObject([]);
});

it("test simple class", function () {
    const code = `
def last(haha):
    pass

class Test:
    def work(value):
        pass

def friction(hehe)
    pass
`;

    const parser = new CodeParser(code);
    const res = parser.findFunctions();
    expect(res).toMatchObject([
        { line: 2, name: "last" },
        { line: 9, name: "friction" },
    ]);
    expect(parser.findClasses()).toMatchObject([
        {
            name: "Test",
            line: 5,
            methods: [
                {
                    name: "Test.work",
                    line: 6,
                },
            ],
        },
    ]);
});

it("test simple class with indented function", function () {
    const code = `
def last(haha):
    pass

class Test:
    def work(value):
        pass

def friction(hehe)
    pass

    def work(value):
        pass
`;

    const parser = new CodeParser(code);
    const res = parser.findFunctions();
    expect(res).toMatchObject([
        { line: 2, name: "last" },
        { line: 9, name: "friction" },
    ]);
    expect(parser.findClasses()).toMatchObject([
        {
            name: "Test",
            line: 5,
            methods: [
                {
                    name: "Test.work",
                    line: 6,
                },
            ],
        },
    ]);
});

it("test simple class with larger class", function () {
    const code = `
def last(haha):
    pass

class Test:
    def work(value):
        pass

    def work2(value):
        pass

    def __init__(self, value):
        pass

def friction(hehe)
    pass

    def work(value):
        pass
`;

    const parser = new CodeParser(code);
    const res = parser.findFunctions();
    expect(res).toMatchObject([
        { line: 2, name: "last" },
        { line: 15, name: "friction" },
    ]);
    expect(parser.findClasses()).toMatchObject([
        {
            name: "Test",
            line: 5,
            methods: [
                {
                    name: "Test.work",
                    line: 6,
                },
                {
                    name: "Test.work2",
                    line: 9,
                },
                {
                    name: "Test.__init__",
                    line: 12,
                },
            ],
        },
    ]);
});
