import "reflect-metadata";
// imports the .env file
import "../lib/env";
import { SignupInfo, LoginInfo, AuthService } from "../services/auth";
import { createSQLiteServerSchema } from "../connect";
import { Container } from "typedi";
import { plainToClass } from "class-transformer";
import { transformAndValidate } from "class-transformer-validator";

describe("server tests", () => {
    beforeAll(async () => {
        await createSQLiteServerSchema();
    });

    it("should login", async () => {
        const authService = Container.get(AuthService);
        const login = new LoginInfo();
        login.email = "test@github.com";
        login.password = "s#cr3tp4ssw0rd";
        const user = await authService.login(login);
        expect(user).toMatchObject({
            email: "test@github.com",
            firstname: "Michal",
        });
        const token = await authService.genToken(user);
        expect(token.length).toBeGreaterThan(12);
        const verfiedUser = await authService.verify(token);
        expect(verfiedUser).toMatchObject({
            email: "test@github.com",
            firstname: "Michal",
        });
    });

    it("signup validation errors", async () => {
        await expect(
            transformAndValidate(SignupInfo, {
                email: "testemail.com",
                password: "password2",
                password2: "password2",
                firstname: "Test",
                lastname: "User",
            })
        ).rejects.toMatchInlineSnapshot(`
                    Array [
                      ValidationError {
                        "children": Array [],
                        "constraints": Object {
                          "isEmail": "email must be an email",
                        },
                        "property": "email",
                        "target": SignupInfo {
                          "email": "testemail.com",
                          "firstname": "Test",
                          "lastname": "User",
                          "password": "password2",
                          "password2": "password2",
                        },
                        "value": "testemail.com",
                      },
                    ]
                `);

        await expect(
            transformAndValidate(SignupInfo, {
                email: "test@email.com",
                password: "pass",
                password2: "pass",
                firstname: "Test",
                lastname: "User",
            })
        ).rejects.toMatchInlineSnapshot(`
                    Array [
                      ValidationError {
                        "children": Array [],
                        "constraints": Object {
                          "minLength": "password must be longer than or equal to 8 characters",
                        },
                        "property": "password",
                        "target": SignupInfo {
                          "email": "test@email.com",
                          "firstname": "Test",
                          "lastname": "User",
                          "password": "pass",
                          "password2": "pass",
                        },
                        "value": "pass",
                      },
                    ]
                `);
    });

    it("signup failures", async () => {
        const authService = Container.get(AuthService);
        await expect(
            authService.signup(
                plainToClass(SignupInfo, {
                    email: "test@email.com",
                    password: "password",
                    password2: "password2",
                    firstname: "Test",
                    lastname: "User",
                })
            )
        ).rejects.toMatchInlineSnapshot("[Error: passwords do not match]");

        await expect(
            authService.signup(
                plainToClass(SignupInfo, {
                    email: "test@github.com",
                    password: "password2",
                    password2: "password2",
                    firstname: "Test",
                    lastname: "User",
                })
            )
        ).rejects.toMatchInlineSnapshot(
            "[Error: user already exists with that email]"
        );
    });

    it("should signup", async () => {
        const authService = Container.get(AuthService);
        await expect(
            authService.signup(
                plainToClass(SignupInfo, {
                    email: "test2@github.com",
                    password: "password2",
                    password2: "password2",
                    firstname: "Test",
                    lastname: "User",
                })
            )
        ).resolves.toMatchObject({ email: "test2@github.com" });
    });
});
