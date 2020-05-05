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
    FieldResolver,
} from "type-graphql";
import {
    getManager,
    Repository,
    EntityManager,
    IsNull,
    SelectQueryBuilder,
} from "typeorm";
import { InjectRepository, InjectManager } from "typeorm-typedi-extensions";
import { GraphQLString } from "graphql";
import { Probe, TraceSet, ProbeFailure } from "../entities";
import { PublicError } from "../utils";
import { genProbeTopic } from "../topics";
import { Context, retrieveProbe } from "../context";
import { ProbeFailureRepository } from "../repositories/probe_failure_repository";

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
        private readonly traceSetRepository: Repository<TraceSet>,
        @InjectManager()
        private readonly manager: EntityManager
    ) {}

    @Query((returns) => Probe, { nullable: true })
    probe(@Arg("key", (_) => GraphQLString) key: string) {
        return this.probeRepository.findOne({
            where: {
                key,
            },
        });
    }

    @Query((returns) => Probe, { nullable: true })
    thisProbe(@Ctx() context: Context) {
        return retrieveProbe(context);
    }

    @FieldResolver((returns) => [ProbeFailure], { nullable: false })
    async failures(
        @Arg("includeTraceAssociated", {
            defaultValue: false,
            description:
                "whether or not to include failures that also are associated to traces",
        })
        includeTraceAssociated: boolean,
        @Ctx() context: Context
    ) {
        const probe = retrieveProbe(context);
        const probeFailureRepository = this.manager.getCustomRepository(
            ProbeFailureRepository
        );

        let builder: SelectQueryBuilder<ProbeFailure>;
        if (includeTraceAssociated)
            builder = probeFailureRepository.buildIncludedTrace();
        else
            builder = probeFailureRepository
                .createQueryBuilder("failure")
                .where("failure.traceId IS NULL");

        return await builder
            .where("failure.probeId = :probeId", { probeId: probe.id })
            .getMany();
    }

    @Mutation((returns) => Probe)
    async heartbeat(@Ctx() context: Context): Promise<Probe> {
        const probe = retrieveProbe(context);
        probe.lastHeartbeat = new Date();
        this.probeRepository.update(probe.id, {
            lastHeartbeat: new Date(),
        });
        probe.traceSet = Promise.resolve(await probe.traceSet);
        return await this.probeRepository.save(probe);
    }

    @Mutation((returns) => Probe)
    async newProbe(@Arg("traceSetKey") key: string): Promise<Probe> {
        const traceSet = await this.traceSetRepository.findOne({
            where: {
                key,
            },
        });
        if (traceSet == null) {
            throw new PublicError("could not find traceSet with given key");
        }
        const probe = this.probeRepository.create({
            lastHeartbeat: new Date(),
        });
        probe.traceSet = Promise.resolve(traceSet);
        return this.probeRepository.save(probe);
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
