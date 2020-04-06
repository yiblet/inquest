import { Resolver, Mutation, Arg, Query } from "type-graphql";
import { Repository, EntityManager } from "typeorm";
import { InjectRepository, InjectManager } from "typeorm-typedi-extensions";
import { TraceState } from "../entities";

@Resolver((of) => TraceState)
export class TraceStateResolver {
    constructor(
        @InjectRepository(TraceState)
        private readonly traceStateRepository: Repository<TraceState>,
        @InjectManager()
        private readonly entityManager: EntityManager
    ) {}

    @Mutation((returns) => TraceState, {
        description: "creates a traceState with a given key",
    })
    async newTraceState(
        @Arg("traceStateKey") key: string
    ): Promise<TraceState> {
        return await this.traceStateRepository.save(
            this.traceStateRepository.create({
                key,
            })
        );
    }

    @Query((returns) => TraceState, {
        nullable: true,
        name: "traceState",
        description: "creates a traceState with a given key",
    })
    async findTraceState(
        @Arg("traceStateKey") key: string
    ): Promise<TraceState> {
        return await this.traceStateRepository.findOne({ key });
    }
}
