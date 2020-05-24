import { Resolver, Query, Ctx } from "type-graphql";
import { EntityManager } from "typeorm";
import { InjectManager } from "typeorm-typedi-extensions";
import { User } from "../entities";
import { Context } from "../context";

@Resolver((of) => User)
export class UserResolver {
    constructor(
        @InjectManager()
        private readonly manager: EntityManager
    ) {}

    @Query((returns) => User, { nullable: true })
    async me(@Ctx() { user }: Context): Promise<User | undefined> {
        return user;
    }
}
