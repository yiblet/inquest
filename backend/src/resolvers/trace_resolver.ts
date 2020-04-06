import {
    Resolver,
    Mutation,
    InputType,
    Arg,
    Field,
    PubSub,
    PubSubEngine,
} from "type-graphql";
import { Repository, EntityManager } from "typeorm";
import { InjectRepository, InjectManager } from "typeorm-typedi-extensions";
import { Trace, TraceLog, TraceSet, TraceLogStatus } from "../entities";
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
    traceSetKey: string;
}

@Resolver((of) => Trace)
export class TraceResolver {
    constructor(
        @InjectRepository(Trace)
        private readonly traceRepository: Repository<Trace>,
        @InjectRepository(TraceSet)
        private readonly traceSetRepository: Repository<TraceSet>,
        @InjectManager()
        private readonly entityManager: EntityManager
    ) {}

    @Mutation((returns) => Trace)
    async newTrace(
        @Arg("newTraceInput") newTraceInput: NewTraceInput,
        @PubSub() pubsub: PubSubEngine
    ): Promise<Trace> {
        return await this.entityManager.transaction(async (manager) => {
            const traceRepository = manager.getRepository(Trace);
            const traceSetRepository = manager.getRepository(TraceSet);
            const probeRepository = manager.getCustomRepository(
                ProbeRepository
            );

            // find the trace set
            const traceSet = await traceSetRepository.findOne({
                key: newTraceInput.traceSetKey,
            });
            if (traceSet == null) {
                throw new Error("could not find trace set");
            }

            const [trace, relevantProbeIds] = await Promise.all([
                // create trace
                traceRepository.save(
                    this.traceRepository.create({
                        module: newTraceInput.module,
                        function: newTraceInput.function,
                        statement: newTraceInput.statement,
                        active: true,
                        traceSetId: traceSet.id,
                    })
                ),
                // find the relevant probes
                probeRepository.findActiveProbesIds(traceSet.id),
            ]);

            // create a new trace log
            const traceLog = await manager.save(
                manager.create(
                    TraceLog,
                    TraceLog.createTrace({
                        traceSetId: traceSet.id,
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
                pubsub.publish(traceSet.key, "new trace"),
            ]);

            return trace;
        });
    }
}
