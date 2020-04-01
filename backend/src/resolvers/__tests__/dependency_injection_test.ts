import { Service, Container, Token } from "typedi";

beforeAll(() => {
    Container.reset();
});

afterAll(() => {
    Container.reset();
});

test("whether or not multiple service declaration allows for the service to be injected", async () => {
    interface Test {
        info: string;
    }
    const token = new Token<Test>("tests");

    @Service({ id: token, multiple: true })
    class Test1 implements Test {
        info: "test1";
    }

    @Service({ id: token, multiple: true })
    class Test2 implements Test {
        info: "tests2";
    }

    const tests = Container.getMany(token);
    const test1 = Container.get(Test1);
    const test2 = Container.get(Test2);
    expect(tests[0].info).toStrictEqual(test1.info);
    expect(tests[1].info).toStrictEqual(test2.info);
    expect(tests[0]).toStrictEqual(test1);
    expect(tests[1]).toStrictEqual(test2);
});
