import {
    Resolver,
    Mutation,
    InputType,
    Arg,
    Field,
    PubSub,
    Publisher,
    Subscription,
    Root,
} from "type-graphql";
import { Repository, EntityManager } from "typeorm";
import { InjectRepository, InjectManager } from "typeorm-typedi-extensions";
import * as Topics from "../topics";
import { Trace, TraceLog, TraceState, TraceLogStatus } from "../entities";
import { ProbeRepository } from "../repositories/probe_repository";

@InputType()
class NewTraceInput {
    @Field({ nullable: false })
    module: string;

    @Field({ nullable: false })
    function: string;

    @Field({ nullable: false })
    statement: string;

    @Field({ nullable: false })
    traceStateKey: string;
}

@Resolver((of) => Trace)
export class TraceResolver {
    constructor(
        @InjectRepository(Trace)
        private readonly traceRepository: Repository<Trace>,
        @InjectRepository(TraceState)
        private readonly traceStateRepository: Repository<TraceState>,
        @InjectManager()
        private readonly entityManager: EntityManager
    ) {}

    @Mutation((returns) => Trace)
    async newTrace(
        @Arg("newTraceInput") newTraceInput: NewTraceInput,
        @PubSub(Topics.TRACES) publish: Publisher<Trace>
    ): Promise<Trace> {
        return await this.entityManager.transaction(async (manager) => {
            const traceRepository = manager.getRepository(Trace);
            const traceStateRepository = manager.getRepository(TraceState);
            const probeRepository = manager.getCustomRepository(
                ProbeRepository
            );

            // find the trace state
            const traceState = await traceStateRepository.findOne({
                key: newTraceInput.traceStateKey,
            });
            if (traceState == null) {
                throw new Error("could not find trace state");
            }

            const [trace, relevantProbeIds] = await Promise.all([
                // create trace
                traceRepository.save(
                    this.traceRepository.create({
                        module: newTraceInput.module,
                        function: newTraceInput.function,
                        statement: newTraceInput.statement,
                    })
                ),
                // find the relevant probes
                probeRepository.findActiveProbesIds(traceState.id),
            ]);

            // create a new trace log
            const traceLog = await manager.save(
                manager.create(
                    TraceLog,
                    TraceLog.createTrace({
                        traceStateId: traceState.id,
                        traceId: trace.id,
                    })
                )
            );

            await Promise.all([
                // create the relevant trace log status
                manager.save(
                    relevantProbeIds.map((id) =>
                        manager.create(
                            TraceLogStatus,
                            TraceLogStatus.newTraceLogstatus({
                                probeId: id,
                                traceLogId: traceLog.id,
                            })
                        )
                    )
                ),
                publish(trace),
            ]);

            return trace;
        });
    }

    @Subscription((returns) => Trace, {
        topics: Topics.TRACES,
    })
    async newTraceSubscription(@Root() trace: Trace): Promise<Trace> {
        return trace;
    }
}
