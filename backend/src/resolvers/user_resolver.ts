import { Resolver, Query, Ctx } from "type-graphql";
import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { User } from "../entities/user";
import { Context } from "../context";

@Resolver((of) => User)
export class UserResolver {
    constructor(
        @InjectRepository(User)
        private readonly probeRepository: Repository<User>
    ) {}

    @Query((returns) => User, { nullable: true })
    async me(@Ctx() { user }: Context): Promise<User> {
        return user;
    }
}
