import {
    Field,
    ObjectType,
    Resolver,
    Root,
    Query,
    Arg,
    Mutation,
    Subscription,
    ResolverTopicData,
} from "type-graphql";
import { getManager, Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { GraphQLString } from "graphql";
import { Probe, TraceState } from "../entities";

@ObjectType()
export class ProbeNotification {
    constructor(message: string, probeKey: string) {
        this.message = message;
        this.probeKey = probeKey;
    }

    @Field({ nullable: false })
    message: string;

    @Field({ nullable: false })
    probeKey: string;

    @Field((type) => Probe, { nullable: false })
    async probe() {
        return await getManager()
            .findOneOrFail(Probe, {
                where: {
                    key: this.probeKey,
                },
            })
            .catch((err) => {
                throw new Error("could not find probe");
            });
    }
}

@Resolver((of) => Probe)
export class ProbeResolver {
    constructor(
        @InjectRepository(Probe)
        private readonly probeRepository: Repository<Probe>,
        @InjectRepository(TraceState)
        private readonly traceStateRepository: Repository<TraceState>
    ) {}

    @Query((returns) => Probe, { nullable: true })
    probe(@Arg("key", (_) => GraphQLString) key: string) {
        return this.probeRepository.findOne({
            where: {
                key,
            },
        });
    }

    @Mutation((returns) => Probe)
    async heartbeat(
        @Arg("key", (_) => GraphQLString) key: string
    ): Promise<Probe> {
        const probe = await this.probeRepository.findOne({
            where: {
                key,
            },
        });
        if (probe === null) {
            throw new Error("probe does not exist");
        }
        probe.lastHeartbeat = new Date();
        return await this.probeRepository.save(probe);
    }

    @Mutation((returns) => Probe)
    async newProbe(@Arg("traceStateKey") key: string): Promise<Probe> {
        const traceState = await this.traceStateRepository.findOne({
            select: ["id"],
            where: {
                key,
            },
        });
        if (traceState == null) {
            throw new Error("could not find traceState with given key");
        }
        return await this.probeRepository.save(
            this.probeRepository.create({
                traceStateId: traceState.id,
                lastHeartbeat: new Date(),
            })
        );
    }

    @Subscription({
        topics: ({ args }) => args.probeKey,
    })
    probeNotification(
        @Root() message: string,
        @Arg("traceStateKey") key: string
    ): string {
        return message;
    }
}
