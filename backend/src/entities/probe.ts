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

import { TraceLog } from "./trace/trace_log";
import { TraceState } from "./trace/trace_state";

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

    @Field()
    @Column()
    lastHeartbeat?: Date;

    @Field()
    @Index({ unique: true })
    @Column({ nullable: false, unique: true })
    @Generated("uuid")
    key: string;

    @Field()
    @Column()
    ip?: string;

    @Field((type) => GraphQLBoolean, { nullable: false })
    isAlive(): boolean {
        // TODO make this smarter
        if (this.lastHeartbeat === null) {
            return false;
        }
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        return twoMinutesAgo >= this.lastHeartbeat;
    }

    @Field((type) => [TraceLog], { nullable: "items" })
    @OneToMany((type) => TraceLog, (traceLog) => traceLog.probe)
    traceLogs: TraceLog[];

    /**
     * the respective TraceState
     */
    @Field({ nullable: false })
    @ManyToOne((type) => TraceState, { nullable: false })
    traceState: TraceState;

    @Index()
    @Column({ nullable: false })
    traceStateId: number;
}
