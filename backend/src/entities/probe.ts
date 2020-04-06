import { Field, ObjectType } from "type-graphql";
import { GraphQLBoolean } from "graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    Generated,
    Column,
    Index,
    OneToMany,
    ManyToOne,
} from "typeorm";

import { TraceState } from "./trace/trace_state";
import { TraceLogStatus } from "./trace/trace_log_status";

/**
 * Probe
 * a running instance of an inquest probe
 * TODO probes should be connected to users
 * TODO probes should list which files are currently being logged
 */
@Entity()
@ObjectType()
export class Probe {
    @PrimaryGeneratedColumn()
    readonly id: number;

    @Field({ nullable: false })
    @Column({ nullable: false })
    lastHeartbeat: Date;

    @Field()
    @Index({ unique: true })
    @Column({ nullable: false, unique: true })
    @Generated("uuid")
    key: string;

    @Field((type) => GraphQLBoolean, { nullable: false })
    isAlive(): boolean {
        // TODO make this smarter
        if (this.lastHeartbeat === null) {
            return false;
        }
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        return twoMinutesAgo >= this.lastHeartbeat;
    }

    @Field((type) => [TraceLogStatus], { nullable: "items" })
    @OneToMany(
        (type) => TraceLogStatus,
        (traceLogStatus) => traceLogStatus.probe
    )
    traceLogStatuses: TraceLogStatus[];

    /**
     * the respective TraceState
     */
    @Field({ nullable: false })
    @ManyToOne((type) => TraceState, { nullable: false })
    traceState: TraceState;

    @Index()
    @Column({ nullable: false })
    traceStateId: number;

    heartbeat() {
        this.lastHeartbeat = new Date();
    }
}
