import { Resolver, Query, Ctx } from "type-graphql";
import { EntityManager } from "typeorm";
import { InjectManager } from "typeorm-typedi-extensions";
import { User, Probe } from "../entities";
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

    // TODO add user auth
    @Query((returns) => [Probe], { nullable: true })
    async liveProbes(): Promise<Probe[]> {
        const qb = this.manager
            .createQueryBuilder(Probe, "probe")
            .where("probe.lastHeartbeat > datetime(:date)", {
                date: new Date(Date.now() - 90 * 1000).toISOString(),
            });
        console.log(qb.getSql());
        return await qb.getMany();
    }
}
