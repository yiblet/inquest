import {
    Field,
    ObjectType,
    Resolver,
    Root,
    Query,
    Arg,
    Ctx,
    Mutation,
    Subscription,
} from "type-graphql";
import { getManager, Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { GraphQLString } from "graphql";
import { Probe, TraceSet } from "../entities";
import { PublicError } from "../utils";
import { genProbeTopic } from "../topics";
import { Context, retrieveProbe } from "../context";

@ObjectType()
export class ProbeNotification {
    constructor(message: string, private traceSetKey: string) {
        this.message = message;
    }

    @Field({ nullable: false })
    message: string;

    @Field((type) => TraceSet, { nullable: false })
    async traceSet() {
        return await getManager()
            .findOneOrFail(TraceSet, {
                where: {
                    key: this.traceSetKey,
                },
            })
            .catch((err) => {
                throw new PublicError("could not find trace set");
            });
    }
}

@Resolver((of) => Probe)
export class ProbeResolver {
    constructor(
        @InjectRepository(Probe)
        private readonly probeRepository: Repository<Probe>,
        @InjectRepository(TraceSet)
        private readonly traceSetRepository: Repository<TraceSet>
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
    async heartbeat(@Ctx() context: Context): Promise<Probe> {
        const probe = retrieveProbe(context);
        probe.lastHeartbeat = new Date();
        return await this.probeRepository.save(probe);
    }

    @Mutation((returns) => Probe)
    async newProbe(@Arg("traceSetKey") key: string): Promise<Probe> {
        const traceSet = await this.traceSetRepository.findOne({
            select: ["id"],
            where: {
                key,
            },
        });
        if (traceSet == null) {
            throw new PublicError("could not find traceSet with given key");
        }
        return await this.probeRepository.save(
            this.probeRepository.create({
                traceSetId: traceSet.id,
                lastHeartbeat: new Date(),
            })
        );
    }

    @Subscription((type) => ProbeNotification, {
        topics: ({ args }) => genProbeTopic(args.traceSetKey),
    })
    async probeNotification(
        @Root() message: string,
        @Arg("traceSetKey") key: string
    ): Promise<ProbeNotification> {
        return new ProbeNotification(message, key);
    }
}
