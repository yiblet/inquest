import { Field, ObjectType } from "type-graphql";
import {
    Entity,
    Index,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    OneToMany,
} from "typeorm";

import { TraceLog } from "./trace_log";

/**
 * TraceState the current desired state of all active statements
 */
@Entity()
@ObjectType()
export class TraceState {
    @PrimaryGeneratedColumn()
    readonly id: number;

    @Field({ nullable: false })
    @Index({ unique: true })
    @Column({ nullable: false, type: "varchar", length: 255 })
    readonly key: string;

    @Field({ nullable: false })
    @CreateDateColumn()
    readonly createdAt: Date;

    @Field({ nullable: false })
    @UpdateDateColumn()
    readonly updatedAt: Date;

    @Field((type) => [TraceLog], { nullable: "items" })
    @OneToMany((type) => TraceLog, (log) => log.traceState)
    traceLogs: TraceLog[];
}
