import { User, PasswordValidity } from "../user";

test("validate password", () => {
    expect(User.validatePassword("testing")).toStrictEqual(
        new PasswordValidity(false, [
            "password must be at least 8 characters long",
        ])
    );
    expect(User.validatePassword("fasdfa")).toStrictEqual(
        new PasswordValidity(false, [
            "password must be at least 8 characters long",
        ])
    );
    expect(User.validatePassword("")).toStrictEqual(
        new PasswordValidity(false, [
            "password must be at least 8 characters long",
        ])
    );
    expect(User.validatePassword("blahblahlbah2@")).toStrictEqual(
        new PasswordValidity(true)
    );
});
