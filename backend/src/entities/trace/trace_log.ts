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
import { TraceState } from "./trace_state";
import { Probe } from "../probe";
import { TraceLogStatus } from "./trace_log_status";

// TODO test if this works
export enum TraceLogType {
    CREATE_TRACE = 1,
    DELETE_TRACE,
    UPDATE_TRACE,
    CREATE_PROBE,
    DELETE_PROBE,
}

registerEnumType(TraceLogType, {
    name: "TraceLogType",
    description: "type of trace log",
});

/**
 * TraceLog displays which trace is currently active (logging)
 *
 * in order for TraceState to be reversible we must maintain a
 * changelog of all the usual types of changes the user may ask
 * to the TraceState. This way as things change it'll be easy to
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
     * the respective TraceState
     */
    @Field((type) => TraceState, { nullable: false })
    @ManyToOne((type) => TraceState, { nullable: false })
    traceState: TraceState;

    @Index()
    @Column({ nullable: false })
    traceStateId: number;

    /**
     * the respective Trace
     * for CREATE_TRACE/ UPDATE_TRACE / DELETE_TRACE
     */
    @Field((type) => Trace, { nullable: true })
    @ManyToOne((type) => Trace, { nullable: true })
    trace: Trace;

    @Index()
    @Column({ nullable: true })
    traceId: string;

    /**
     * the respective probe
     * for CREATE_PROBE / DELETE_PROBE
     */
    @Field((type) => Probe, { nullable: true })
    @ManyToOne((type) => Probe, { nullable: true })
    probe: Probe;

    @Index()
    @Column({ nullable: true })
    probeId: string;

    /**
     * the status of each probe in enacting this change to the trace state
     * change
     */
    @Field((type) => [TraceLogStatus], { nullable: "items" })
    @OneToMany((type) => TraceLogStatus, (status) => status.traceLog)
    traceLogStatus: TraceLogStatus[];
}
