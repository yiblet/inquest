import {
    Resolver,
    Mutation,
    InputType,
    Arg,
    Field,
    PubSub,
    PubSubEngine,
    Root,
    FieldResolver,
} from "type-graphql";
import { EntityManager } from "typeorm";
import { InjectManager } from "typeorm-typedi-extensions";
import {
    Trace,
    TraceLog,
    TraceSet,
    TraceLogStatus,
    FunctionInfo,
    ProbeFailure,
} from "../entities";
import { ProbeRepository } from "../repositories/probe_repository";
import { TraceLogRepository } from "../repositories/trace_log_repository";
import { PublicError, createTransaction } from "../utils";
import { genProbeTopic } from "../topics";
import { GraphQLInt } from "graphql";

@InputType()
class UpdateTraceInput {
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
    functionId: string;

    @Field((type) => GraphQLInt, { nullable: false })
    line: number;

    @Field({ nullable: false })
    statement: string;

    @Field({ nullable: false })
    traceSetKey: string;
}

@Resolver((of) => Trace)
export class TraceResolver {
    constructor(
        @InjectManager()
        private readonly manager: EntityManager
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

    @FieldResolver((returns) => [ProbeFailure], { nullable: false })
    async currentFailures(@Root() trace: Trace) {
        return await this.manager.find(ProbeFailure, {
            traceId: trace.id,
            traceVersion: trace.version,
        });
    }

    @Mutation((returns) => Trace)
    async deleteTrace(
        @Arg("traceId") traceId: string,
        @PubSub() pubsub: PubSubEngine
    ): Promise<Trace> {
        return await createTransaction(this.manager, async (manager) => {
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

            await pubsub.publish(genProbeTopic(traceSet.key), "delete trace");
            return trace;
        });
    }

    // TODO convert updates to no-ops if nothing is changed
    @Mutation((returns) => Trace)
    async updateTrace(
        @Arg("updateTraceInput") updateTraceInput: UpdateTraceInput,
        @PubSub() pubsub: PubSubEngine
    ): Promise<Trace> {
        return await createTransaction(this.manager, async (manager) => {
            const traceRepository = manager.getRepository(Trace);

            let trace = await traceRepository.findOne({
                where: { id: updateTraceInput.id },
                relations: ["traceSet"],
            });
            if (trace == null) {
                throw new PublicError("could not find trace with that id");
            }

            // setting updates
            for (const field of ["statement", "active"]) {
                if (updateTraceInput[field] != null) {
                    trace[field] = updateTraceInput[field];
                }
            }

            if (updateTraceInput.statement != null) {
                trace.version++;
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
            await pubsub.publish(genProbeTopic(traceSet.key), "update trace");
            return trace;
        });
    }

    @Mutation((returns) => Trace)
    async newTrace(
        @Arg("newTraceInput") newTraceInput: NewTraceInput,
        @PubSub() pubsub: PubSubEngine
    ): Promise<Trace> {
        return await createTransaction(this.manager, async (manager) => {
            const traceRepository = manager.getRepository(Trace);
            const traceSetRepository = manager.getRepository(TraceSet);

            // find the trace set
            const traceSet = await traceSetRepository.findOne({
                key: newTraceInput.traceSetKey,
            });
            if (traceSet == null) {
                throw new PublicError("could not find trace set");
            }

            const func = await this.manager.findOne(
                FunctionInfo,
                newTraceInput.functionId
            );

            if (func == null) {
                throw new PublicError("could not find function");
            }

            const trace = await traceRepository.save(
                traceRepository.create({
                    functionId: func.id,
                    line: newTraceInput.line,
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
            await pubsub.publish(genProbeTopic(traceSet.key), "new trace");
            return trace;
        });
    }
}
