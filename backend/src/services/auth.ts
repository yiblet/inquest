import { EntityManager } from "typeorm";
import { Service } from "typedi";
import { User, Organization } from "../entities";
import { InjectManager } from "typeorm-typedi-extensions";
import { sign, verify } from "jsonwebtoken";
import { config } from "./../config";
import { PublicError } from "../utils";
import express from "express";
import * as cv from "class-validator";

export class LoginInfo {
    @cv.IsNotEmpty()
    @cv.IsEmail()
    email: string;

    @cv.IsNotEmpty()
    @cv.MinLength(8)
    @cv.MaxLength(24)
    password: string;
}

export class SignupInfo extends LoginInfo {
    @cv.IsNotEmpty()
    firstname: string;

    @cv.IsNotEmpty()
    lastname: string;

    @cv.Allow()
    password2: string;
}

export class ValidationException extends PublicError {
    constructor(public readonly validationExceptions: string[]) {
        super(validationExceptions.join("\n"));
    }
}

/**
 * AuthService
 * contains the necessary tools to authenticate users. It does the work
 * of retrieving the user information when logging in as well as uncovering
 * the the auth token
 */
@Service()
export class AuthService {
    constructor(
        @InjectManager()
        private manager: EntityManager
    ) {}

    /**
     * signup
     * creates the user
     */
    async signup(info: SignupInfo): Promise<User> {
        return this.manager.transaction(async (manager) => {
            const userRepository = manager.getRepository(User);
            const orgRepository = manager.getRepository(Organization);
            if (info.password != info.password2) {
                throw new PublicError("passwords do not match");
            }
            await cv.validateOrReject(info);

            let user = await manager.findOne(User, {
                email: info.email,
            });

            if (user)
                throw new PublicError("user already exists with that email");

            const organization = await orgRepository.save(
                Organization.create({ name: info.email })
            );

            user = User.create({
                firstname: info.firstname,
                lastname: info.lastname,
                email: info.email,
                organizationId: organization.id,
                password: await User.hashPassword(info.password, false),
            });

            const validUser = await user.isValid(info.password);
            if (validUser.length === 0) {
                return await manager.save(user);
            } else {
                throw new ValidationException(validUser);
            }
        });
    }

    /**
     * login
     * retrieves the user based on login information
     */
    async login(info: LoginInfo) {
        await cv.validateOrReject(info);
        const { password, email } = info;
        const user = await this.manager.findOne(User, {
            email: email,
        });
        if (!user)
            throw new PublicError("password or email could not be found");
        if (!(await user.isPassword(password)))
            throw new PublicError("password or email could not be found");
        return user;
    }

    /**
     * genToken
     * retrieves the user based on login information
     */
    genToken(user: User): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            sign(
                {
                    email: user.email,
                    id: user.id,
                },
                config.auth.secret,
                { expiresIn: "3d" },
                (err, token) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(token);
                    }
                }
            );
        });
    }

    /**
     * genToken
     * retrieves the user based on token information
     */
    async verify(token: string): Promise<User> {
        const id = await new Promise<number>((resolve, reject) =>
            verify(
                token,
                config.auth.secret,
                {
                    maxAge: "3d",
                },
                (err, token: { id?: string }) => {
                    if (err) return reject(err);
                    const id = parseInt(token.id ?? "");
                    if (!id || isNaN(id))
                        return reject(new PublicError("missing id value"));
                    resolve(id);
                }
            )
        );

        const user = await this.manager.findOne(User, id);
        if (!user) {
            throw new PublicError("invalid user id");
        }
        return user;
    }
}

function parseAuth(authorization: string) {
    const auth = authorization.split(" ");
    if (auth.length !== 2)
        throw new PublicError("invalid authorization format");
    const [type, base64string] = authorization.split(" ");
    if (type !== "Basic") {
        throw new PublicError("authorization must be basic auth");
    }

    const loginToken = Buffer.from(base64string.trim(), "base64").toString(
        "utf8"
    );
    const loginTokenSplit = loginToken.split(":");
    if (loginTokenSplit.length !== 2)
        throw new PublicError("invalid authorization login format");
    return loginTokenSplit;
}

/**
 * returns the probeId
 */
export function getProbeAuth(authorization: string) {
    const loginTokenSplit = parseAuth(authorization);
    const [account] = loginTokenSplit;
    if (!account.startsWith("probe_"))
        throw new PublicError("invalid account type");
    return account.substring("probe_".length);
}

/**
 * returns the user token
 */
export function getUserAuthToken(req: express.Request) {
    const authorization: string | undefined = req.get("authorization");
    if (!authorization) throw new PublicError("failed to get authorization");
    const loginTokenSplit = parseAuth(authorization);
    const [account, loginTokenPass] = loginTokenSplit;
    if (!account.startsWith("user_"))
        throw new PublicError("invalid account type");
    return loginTokenPass;
}
