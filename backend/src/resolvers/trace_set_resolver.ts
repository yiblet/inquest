import {
    Root,
    FieldResolver,
    Resolver,
    Mutation,
    Arg,
    Query,
} from "type-graphql";
import { Repository, EntityManager } from "typeorm";
import { InjectRepository, InjectManager } from "typeorm-typedi-extensions";
import { Trace, TraceSet } from "../entities";

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
                active: true,
            },
            order: {
                updatedAt: "DESC",
            },
        });
    }

    @Mutation((returns) => TraceSet, {
        description: "creates a traceSet with a given key",
    })
    async newTraceSet(@Arg("traceSetKey") key: string): Promise<TraceSet> {
        return await this.traceSetRepository.save(
            this.traceSetRepository.create({
                key,
            })
        );
    }

    @Query((returns) => TraceSet, {
        nullable: true,
        name: "traceSet",
        description: "creates a traceSet with a given key",
    })
    async findTraceSet(@Arg("traceSetKey") key: string): Promise<TraceSet> {
        return await this.traceSetRepository.findOne({ key });
    }
}
