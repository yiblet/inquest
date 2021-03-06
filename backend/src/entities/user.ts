import { Field, ID, ObjectType, Arg } from "type-graphql";
import { GraphQLBoolean, GraphQLString } from "graphql";
import {
    Index,
    PrimaryGeneratedColumn,
    Column,
    Entity,
    ManyToOne,
} from "typeorm";
import { validate, MinLength, IsEmail } from "class-validator";
import { hash, compare } from "bcrypt";
import { PublicError } from "../utils";
import { Organization } from "./organization";
import { plainToClass } from "class-transformer";

@ObjectType()
export class PasswordValidity {
    constructor(isValid: boolean, errors: string[] | null = null) {
        this.isValid = isValid;
        if (!isValid && (errors == null || errors.length === 0)) {
            throw new PublicError(
                "an invalid password must have an explanation"
            );
        }
        this._errors = errors;
    }

    @Field({ nullable: false })
    isValid: boolean;

    private _errors: string[] | null;

    @Field((type) => [GraphQLString])
    get errors(): string[] {
        if (!this._errors) return [];
        return this._errors;
    }
}

@ObjectType()
@Entity()
export class User {
    @Field((type) => ID)
    @PrimaryGeneratedColumn()
    readonly id: number;

    @Field()
    @IsEmail()
    @Index({ unique: true })
    @Column({ nullable: false, unique: true })
    email: string;

    @MinLength(1)
    @Field({ nullable: false })
    @Column({ nullable: false })
    firstname: string;

    @MinLength(1)
    @Field({ nullable: false })
    @Column({ nullable: false })
    lastname: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    nickname?: string;

    @Field((type) => Organization, { nullable: false })
    @ManyToOne((type) => Organization, (org) => org.traceSets)
    organization: Promise<Organization>;

    @Column()
    organizationId: string;

    @Column()
    password: string;

    static create(data: {
        email: string;
        firstname: string;
        lastname: string;
        organizationId: string;
        password: string;
    }) {
        return plainToClass(User, data);
    }

    @Field((type) => GraphQLBoolean, {
        description: "checks the user's password",
    })
    async isPassword(
        @Arg("password", { nullable: false }) password: string
    ): Promise<boolean> {
        return (
            User.validatePassword(password).isValid &&
            (await compare(password, this.password))
        );
    }

    async isValid(password: string) {
        return [
            ...(await validate(this)).map((error) => error.toString()),
            ...User.validatePassword(password).errors,
        ];
    }

    static async hashPassword(
        password: string,
        validate = true
    ): Promise<string> {
        if (validate) {
            const validity = User.validatePassword(password);
            if (validity.isValid === false) {
                throw new PublicError(validity.errors.join("; "));
            }
        }
        return await hash(password, 10);
    }

    @Field((type) => PasswordValidity, {
        description: "validates the user's password",
    })
    static validatePassword(
        @Arg("password", { nullable: false }) password: string
    ): PasswordValidity {
        const errors: string[] = [];
        if (password.length < 8) {
            errors.push("password must be at least 8 characters long");
        }
        if (password.length > 24) {
            errors.push("password must be at most 24 characters long");
        }
        if (password.search(/\s/) !== -1) {
            errors.push("password can not contain whitespace");
        }
        if (errors.length === 0) {
            return new PasswordValidity(true);
        }
        return new PasswordValidity(false, errors);
    }
}
