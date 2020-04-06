import { Resolver, FieldResolver, Root } from "type-graphql";
import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";

import { Rate, User } from "../entities";

@Resolver((of) => Rate)
export class RateResolver {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    @FieldResolver()
    async user(@Root() rate: Rate): Promise<User> {
        return await this.userRepository.findOne(rate.userId, {
            cache: 1000,
        });
    }
}
