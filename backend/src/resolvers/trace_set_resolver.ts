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
import { Trace, TraceSet } from "../entities";
import { Context } from "../context";

@Resolver((of) => TraceSet)
export class TraceSetResolver {
    constructor(
        @InjectRepository(TraceSet)
        private readonly traceSetRepository: Repository<TraceSet>,
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
}
