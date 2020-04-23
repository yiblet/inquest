import { List, ImmMap } from "../collections";

it("test equality", () => {
    expect(ImmMap()).toEqual(ImmMap());
});

it("test list", () => {
    const list1 = List([1, 2, 3]);
    expect(list1.filter((x) => x % 2 !== 0)).toEqual(
        list1.filter((x) => x % 2 !== 0)
    );
    expect(list1.filter((x) => x % 2 !== 0).push(2)).toEqual(
        list1.filter((x) => x % 2 !== 0).push(2)
    );
});
