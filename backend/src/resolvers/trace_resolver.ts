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
import { TraceLogRepository } from "../repositories/trace_log_repository";
import { PublicError } from "../utils";

@InputType()
class UpdateTraceInput {
    @Field({ nullable: true })
    module?: string;

    @Field({ nullable: true })
    function?: string;

    @Field({ nullable: true })
    statement?: string;

    @Field({ nullable: true })
    active?: boolean;

    @Field({ nullable: false })
    id: string;
}

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

    protected async createRelevantLogStatuses(
        manager: EntityManager,
        traceLog: TraceLog
    ): Promise<TraceLogStatus[]> {
        const probeRepository = manager.getCustomRepository(ProbeRepository);
        const relevantProbeIds = await probeRepository.findActiveProbesIds(
            traceLog.traceSetId
        );

        return relevantProbeIds.map((id) =>
            manager.create(
                TraceLogStatus,
                TraceLogStatus.newTraceLogstatus({
                    probeId: id,
                    traceLogId: traceLog.id,
                })
            )
        );
    }

    private static async saveTraceLogWithRelevantLogStatuses(
        manager: EntityManager,
        traceLogPartial: TraceLog
    ): Promise<TraceLog> {
        const traceLog = await manager.save<TraceLog>(traceLogPartial);
        await manager.save(
            await manager
                .getCustomRepository(TraceLogRepository)
                .createRelevantLogStatuses(traceLog)
        );
        return traceLog;
    }

    @Mutation((returns) => Trace)
    async deleteTrace(
        @Arg("traceId") traceId: string,
        @PubSub() pubsub: PubSubEngine
    ): Promise<Trace> {
        return await this.entityManager.transaction(async (manager) => {
            const traceRepository = manager.getRepository(Trace);
            let trace = await traceRepository.findOne({
                where: { id: traceId },
                relations: ["traceSet"],
            });
            if (trace == null) {
                throw new PublicError("could not find trace with that id");
            }
            trace = await manager.softRemove(trace);
            const traceSet = await trace.traceSet;
            await TraceResolver.saveTraceLogWithRelevantLogStatuses(
                manager,
                manager.create(
                    TraceLog,
                    TraceLog.deleteTrace({
                        traceSetId: traceSet.id,
                        traceId: trace.id,
                    })
                )
            );

            await pubsub.publish(traceSet.key, "delete trace");
            return trace;
        });
    }

    // TODO convert updates to no-ops if nothing is changed
    @Mutation((returns) => Trace)
    async updateTrace(
        @Arg("updateTraceInput") updateTraceInput: UpdateTraceInput,
        @PubSub() pubsub: PubSubEngine
    ): Promise<Trace> {
        return await this.entityManager.transaction(async (manager) => {
            const traceRepository = manager.getRepository(Trace);

            let trace = await traceRepository.findOne({
                where: { id: updateTraceInput.id },
                relations: ["traceSet"],
            });
            if (trace == null) {
                throw new PublicError("could not find trace with that id");
            }

            // setting updates
            for (const field of ["module", "statement", "function", "active"]) {
                if (updateTraceInput[field] != null) {
                    trace[field] = updateTraceInput[field];
                }
            }

            trace = await manager.save(trace);
            const traceSet = await trace.traceSet;

            // create a new trace log
            await TraceResolver.saveTraceLogWithRelevantLogStatuses(
                manager,
                manager.create(
                    TraceLog,
                    TraceLog.updateTrace({
                        traceSetId: traceSet.id,
                        traceId: trace.id,
                    })
                )
            );
            await pubsub.publish(traceSet.key, "update trace");
            return trace;
        });
    }

    @Mutation((returns) => Trace)
    async newTrace(
        @Arg("newTraceInput") newTraceInput: NewTraceInput,
        @PubSub() pubsub: PubSubEngine
    ): Promise<Trace> {
        return await this.entityManager.transaction(async (manager) => {
            const traceRepository = manager.getRepository(Trace);
            const traceSetRepository = manager.getRepository(TraceSet);

            // find the trace set
            const traceSet = await traceSetRepository.findOne({
                key: newTraceInput.traceSetKey,
            });
            if (traceSet == null) {
                throw new PublicError("could not find trace set");
            }

            const trace = await traceRepository.save(
                this.traceRepository.create({
                    module: newTraceInput.module,
                    function: newTraceInput.function,
                    statement: newTraceInput.statement,
                    active: true,
                    traceSetId: traceSet.id,
                })
            );

            // create a new trace log
            await TraceResolver.saveTraceLogWithRelevantLogStatuses(
                manager,
                manager.create(
                    TraceLog,
                    TraceLog.createTrace({
                        traceSetId: traceSet.id,
                        traceId: trace.id,
                    })
                )
            );
            await pubsub.publish(traceSet.key, "new trace");
            return trace;
        });
    }
}
