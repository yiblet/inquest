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
    SelectQueryBuilder,
} from "typeorm";
import { InjectRepository, InjectManager } from "typeorm-typedi-extensions";
import { GraphQLString } from "graphql";
import { Probe, TraceSet, ProbeFailure } from "../entities";
import { PublicError } from "../utils";
import { genProbeTopic } from "../topics";
import { Context } from "../context";
import { ProbeFailureRepository } from "../repositories/probe_failure_repository";

@ObjectType()
export class ProbeNotification {
    constructor(message: string, private traceSetId: string) {
        this.message = message;
    }

    @Field({ nullable: false })
    message: string;

    @Field((type) => TraceSet, { nullable: false })
    async traceSet() {
        return await getManager()
            .findOneOrFail(TraceSet, {
                where: {
                    id: this.traceSetId,
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
    probe(@Arg("probeId", (_) => GraphQLString) id: string) {
        return this.probeRepository.findOne({
            where: {
                id,
            },
        });
    }

    @Query((returns) => Probe, { nullable: true })
    thisProbe(@Ctx() context: Context) {
        return context.probe;
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
        const probe = context.probe;
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
        const probe = context.probe;
        probe.lastHeartbeat = new Date();
        this.probeRepository.update(probe.id, {
            lastHeartbeat: new Date(),
        });
        probe.traceSet = Promise.resolve(await probe.traceSet);
        return await this.probeRepository.save(probe);
    }

    @Mutation((returns) => Probe)
    async newProbe(@Arg("traceSetId") id: string): Promise<Probe> {
        const traceSet = await this.traceSetRepository.findOne({
            where: {
                id,
            },
        });
        if (traceSet == null) {
            throw new PublicError("could not find traceSet with given id");
        }
        const probe = this.probeRepository.create({
            lastHeartbeat: new Date(),
        });
        probe.traceSet = Promise.resolve(traceSet);
        return this.probeRepository.save(probe);
    }

    @Subscription((type) => ProbeNotification, {
        topics: ({ args }) => genProbeTopic(args.traceSetId),
    })
    async probeNotification(
        @Root() message: string,
        @Arg("traceSetId") id: string
    ): Promise<ProbeNotification> {
        return new ProbeNotification(message, id);
    }
}
