import {
    Resolver,
    Mutation,
    InputType,
    Arg,
    Field,
    PubSub,
    PubSubEngine,
    Ctx,
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
    Function,
    TraceFailure,
} from "../entities";
import { ProbeRepository } from "../repositories/probe_repository";
import { TraceLogRepository } from "../repositories/trace_log_repository";
import { PublicError } from "../utils";
import { genProbeTopic } from "../topics";
import { Context, retrieveProbe } from "../context";

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

    @FieldResolver((returns) => [TraceFailure], { nullable: false })
    async currentFailures(@Root() trace: Trace) {
        return await this.manager.find(TraceFailure, {
            traceId: trace.id,
            traceVersion: trace.version,
        });
    }

    @Mutation((returns) => TraceFailure)
    async newTraceFailure(
        @Arg("traceId") traceId: string,
        @Arg("message") message: string,
        @Ctx() context: Context
    ): Promise<TraceFailure> {
        return await this.manager.transaction(async (manager) => {
            const probe = retrieveProbe(context);
            const trace = await manager.getRepository(Trace).findOne({
                where: { id: traceId },
            });
            if (trace == null) {
                throw new PublicError("could not find trace with that id");
            }

            const failure = manager.create(TraceFailure, {
                traceVersion: trace.version,
                message,
                traceId: trace.id,
                probeId: probe.id,
            });

            return await manager.save(failure);
        });
    }

    @Mutation((returns) => Trace)
    async deleteTrace(
        @Arg("traceId") traceId: string,
        @PubSub() pubsub: PubSubEngine
    ): Promise<Trace> {
        return await this.manager.transaction(async (manager) => {
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
        return await this.manager.transaction(async (manager) => {
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
        return await this.manager.transaction(async (manager) => {
            const traceRepository = manager.getRepository(Trace);
            const traceSetRepository = manager.getRepository(TraceSet);

            // find the trace set
            const traceSet = await traceSetRepository.findOne({
                key: newTraceInput.traceSetKey,
            });
            if (traceSet == null) {
                throw new PublicError("could not find trace set");
            }

            const func = await TraceResolver.findFunctionByName(
                newTraceInput.module,
                newTraceInput.function,
                manager
            );

            if (func == null) {
                throw new PublicError("could not find function");
            }

            const trace = await traceRepository.save(
                traceRepository.create({
                    functionId: func.id,
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

    static async findFunctionByName(
        module: string,
        func: string,
        manager: EntityManager
    ) {
        const path = func.split(".");
        if (path.length > 2) {
            throw new PublicError(
                "system does not support classes inside of classes"
            );
        }
        if (path.length === 0) {
            throw new Error("unexpected behavior of String.split");
        }
        if (path.length === 1) {
            return manager
                .createQueryBuilder(Function, "function")
                .innerJoinAndSelect(
                    "function.module",
                    "module",
                    "module.name = :name AND function.name = :funcName",
                    {
                        funcName: func,
                        name: module,
                    }
                )
                .getOne();
        }

        if (path.length === 2)
            return manager
                .createQueryBuilder(Function, "function")
                .innerJoinAndSelect(
                    "function.parentClass",
                    "class",
                    "class.name = :name and function.name = :funcName",
                    {
                        name: path[0],
                        funcName: path[1],
                    }
                )
                .innerJoinAndSelect(
                    "class.module",
                    "module",
                    "module.name = :name",
                    {
                        name: module,
                    }
                )
                .getOne();
    }
}
