import { Field, ID, ObjectType, Arg } from "type-graphql";
import { GraphQLBoolean, GraphQLString } from "graphql";
import { PrimaryGeneratedColumn, Column, Entity } from "typeorm";
import { Min, Max, IsEmail } from "class-validator";
import { hash, compare } from "bcrypt";

@ObjectType()
export class PasswordValidity {
    constructor(isValid: boolean, errors: string[] | null = null) {
        this.isValid = isValid;
        if (!isValid && (errors == null || errors.length === 0)) {
            throw new Error("an invalid password must have an explanation");
        }
        this.errors = errors;
    }

    @Field({ nullable: false })
    isValid: boolean;

    @Field((type) => [GraphQLString])
    errors?: string[];
}

@ObjectType()
@Entity()
export class User {
    @Field((type) => ID)
    @PrimaryGeneratedColumn()
    readonly id: number;

    @Field()
    @IsEmail()
    @Column()
    email: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    nickname?: string;

    @Column()
    password: string;

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

    static async hashPassword(
        password: string,
        validate = true
    ): Promise<string> {
        if (validate) {
            const validity = User.validatePassword(password);
            if (validity.isValid === false) {
                throw new Error(validity.errors.join("; "));
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
        if (password.search(/\W/) === -1) {
            errors.push("password must contain a special character");
        }
        if (errors.length === 0) {
            return new PasswordValidity(true);
        }
        return new PasswordValidity(false, errors);
    }
}
