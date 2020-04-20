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

import { TraceSet } from "./trace/trace_set";
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
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        return twoMinutesAgo >= this.lastHeartbeat;
    }

    @Field((type) => [TraceLogStatus], { nullable: false })
    @OneToMany(
        (type) => TraceLogStatus,
        (traceLogStatus) => traceLogStatus.probe
    )
    traceLogStatuses: Promise<TraceLogStatus[]>;

    /**
     * the respective TraceSet
     */
    @Field((type) => TraceSet, { nullable: false })
    @ManyToOne((type) => TraceSet, { nullable: false })
    traceSet: Promise<TraceSet>;

    @Index()
    @Column({ nullable: false })
    traceSetId: number;

    heartbeat() {
        this.lastHeartbeat = new Date();
    }
}
