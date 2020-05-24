import {
    Root,
    FieldResolver,
    Resolver,
    Mutation,
    Arg,
    Query,
    Ctx,
} from "type-graphql";
import { Repository, EntityManager, Not, IsNull } from "typeorm";
import { InjectRepository, InjectManager } from "typeorm-typedi-extensions";
import { Trace, TraceSet, Probe, DirectoryInfo } from "../entities";
import { Context } from "../context";
import { DirectoryInfoRepository } from "../repositories/directory_info_repository";

@Resolver((of) => TraceSet)
export class TraceSetResolver {
    constructor(
        @InjectRepository(TraceSet)
        private readonly traceSetRepository: Repository<TraceSet>,
        @InjectRepository(DirectoryInfo)
        private readonly directoryInfoRepository: DirectoryInfoRepository,
        @InjectManager()
        private readonly entityManager: EntityManager
    ) {}

    @FieldResolver((returns) => [Trace], {
        description: "the desired set according to this traceSet",
    })
    async desiredSet(@Root() traceSet: TraceSet): Promise<Trace[]> {
        return await this.entityManager.find(Trace, {
            where: {
                traceSetId: traceSet.id,
                functionId: Not(IsNull()),
                active: true,
            },
            order: {
                // first order by updatedAt
                // NOTE: updatedAt is set to second precision
                updatedAt: "DESC",
            },
        });
    }

    @Mutation((returns) => TraceSet, {
        description: "creates a traceSet with a given id",
    })
    async newTraceSet(@Ctx() context: Context): Promise<TraceSet> {
        return await this.traceSetRepository.save(
            TraceSet.create({
                organizationId: (await context.organization()).id,
            })
        );
    }

    @Query((returns) => TraceSet, {
        nullable: true,
        name: "traceSet",
        description: "creates a traceSet with a given id",
    })
    async findTraceSet(
        @Arg("traceSetId") id: string
    ): Promise<TraceSet | undefined> {
        return await this.traceSetRepository.findOne({ id });
    }

    // TODO add user auth
    @FieldResolver((returns) => [Probe], { nullable: true })
    async liveProbes(@Root() traceSet: TraceSet): Promise<Probe[]> {
        const qb = this.entityManager
            .createQueryBuilder(Probe, "probe")
            .where(
                "probe.lastHeartbeat > datetime(:date) AND probe.closed = false AND probe.traceSetId = :traceSetId",
                {
                    date: new Date(Date.now() - 90 * 1000).toISOString(),
                    traceSetId: traceSet.id,
                }
            );
        return await qb.getMany();
    }

    @FieldResolver((type) => DirectoryInfo, { nullable: false })
    async rootDirectory(@Root() traceSet: TraceSet): Promise<DirectoryInfo> {
        return await this.directoryInfoRepository.genRootDir(traceSet.id);
    }
}
