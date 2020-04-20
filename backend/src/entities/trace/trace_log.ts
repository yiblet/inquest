import { Field, ObjectType, registerEnumType } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    Column,
    OneToMany,
} from "typeorm";

import { Trace } from "./trace";
import { TraceSet } from "./trace_set";
import { Probe } from "../probe";
import { TraceLogStatus } from "./trace_log_status";

// TODO test if this works
export enum TraceLogType {
    CREATE_TRACE = 0,
    DELETE_TRACE,
    UPDATE_TRACE,
    CREATE_PROBE,
    DELETE_PROBE,
}

registerEnumType(TraceLogType, {
    name: "TraceLogType",
    description: "type of trace log",
});

export type StateChange = {
    traceSetId: number;
    traceId: string;
};

/**
 * TraceLog displays which trace is currently active (logging)
 *
 * in order for TraceSet to be reversible we must maintain a
 * changelog of all the usual types of changes the user may ask
 * to the TraceSet. This way as things change it'll be easy to
 * track user changes and to revert them if necessary.
 */
@Entity()
@ObjectType()
export class TraceLog {
    @Field({ nullable: false })
    @PrimaryGeneratedColumn("uuid")
    readonly id: string;

    @Field({ nullable: false })
    @CreateDateColumn()
    readonly createdAt: Date;

    @Field({ nullable: false })
    @UpdateDateColumn()
    readonly updatedAt: Date;

    @Field((type) => TraceLogType, { nullable: false })
    @Index()
    @Column({ nullable: false, type: "varchar" })
    readonly type: TraceLogType;

    /**
     * the respective TraceSet
     */
    @Field((type) => TraceSet, { nullable: false })
    @ManyToOne((type) => TraceSet, { nullable: false })
    traceSet: Promise<TraceSet>;

    @Index()
    @Column({ nullable: false })
    traceSetId: number;

    /**
     * the respective Trace
     * for CREATE_TRACE/ UPDATE_TRACE / DELETE_TRACE
     */
    @Field((type) => Trace, { nullable: true })
    @ManyToOne((type) => Trace, { nullable: true })
    trace: Promise<Trace | undefined>;

    @Index()
    @Column({ nullable: true })
    traceId?: string;

    /**
     * the respective probe
     * for CREATE_PROBE / DELETE_PROBE
     */
    @Field((type) => Probe, { nullable: true })
    @ManyToOne((type) => Probe, { nullable: true })
    probe: Promise<Probe | undefined>;

    @Index()
    @Column({ nullable: true })
    probeId?: string;

    /**
     * the status of each probe in enacting this change to the trace state
     * change
     */
    @Field((type) => [TraceLogStatus], { nullable: "items" })
    @OneToMany((type) => TraceLogStatus, (status) => status.traceLog)
    traceLogStatuses: Promise<TraceLogStatus[]>;

    static createTrace(stateChange: StateChange): Partial<TraceLog> {
        return TraceLog.stateChange(TraceLogType.CREATE_TRACE, stateChange);
    }

    static updateTrace(stateChange: StateChange): Partial<TraceLog> {
        return TraceLog.stateChange(TraceLogType.UPDATE_TRACE, stateChange);
    }
    static deleteTrace(stateChange: StateChange): Partial<TraceLog> {
        return TraceLog.stateChange(TraceLogType.DELETE_TRACE, stateChange);
    }

    private static stateChange(
        type: TraceLogType,
        stateChange: StateChange
    ): Partial<TraceLog> {
        return {
            type,
            traceSetId: stateChange.traceSetId,
            traceId: stateChange.traceId,
        };
    }
}
