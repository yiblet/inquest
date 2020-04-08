import { Field, ObjectType, registerEnumType } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    Column,
} from "typeorm";

import { TraceLog } from "./trace_log";
import { Probe } from "../probe";

// TODO test if this works
export enum TraceLogStatusState {
    SENT = 0,
    SUCCESS,
    ERROR,
}

registerEnumType(TraceLogStatusState, {
    name: "TraceLogStatusState",
    description: "the state of the trace log status",
});

/**
 * TraceLogStatus
 * holds information of the result of a tracelog change
 *
 * when the user adds a new log statement there needs to
 * be information tracking the deployment of the change
 * of this log statement on the set of probes affected.
 * TraceLogStatus is the entity that fulfills that job.
 * For each create, update, or delete this log status
 * will track whether or not it succeeded for each probe.
 */
@Entity()
@ObjectType()
export class TraceLogStatus {
    @Field({ nullable: false })
    @PrimaryGeneratedColumn("uuid")
    readonly id: string;

    @Field({ nullable: false })
    @CreateDateColumn()
    readonly createdAt: Date;

    @Field({ nullable: false })
    @UpdateDateColumn()
    readonly updatedAt: Date;

    @Field((type) => TraceLogStatusState, { nullable: false })
    @Column({ nullable: false, type: "int", default: TraceLogStatusState.SENT })
    type: TraceLogStatusState;

    @Field({ nullable: true })
    @Column({ nullable: true })
    message: string;

    @Field((type) => Probe, { nullable: false })
    @ManyToOne((type) => Probe, { nullable: false })
    probe: Promise<Probe>;

    @Index()
    @Column({ nullable: false })
    probeId: number;

    @Field((type) => TraceLog, { nullable: false })
    @ManyToOne((type) => TraceLog, { nullable: false })
    traceLog: Promise<TraceLog>;

    @Index()
    @Column({ nullable: false })
    traceLogId: string;

    static newTraceLogstatus(relations: {
        probeId: number;
        traceLogId: string;
    }): Partial<TraceLogStatus> {
        return {
            type: TraceLogStatusState.SENT,
            ...relations,
        };
    }
}
