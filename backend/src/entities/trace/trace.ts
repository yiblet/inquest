import { Field, ObjectType } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Column,
    Index,
    ManyToOne,
    OneToMany,
} from "typeorm";

import { TraceSet } from "./trace_set";
import { Function } from "../code/function";
import { TraceFailure } from "./trace_failure";

/**
 * Trace
 * a trace models a log statement. A single probe will be enacting multipe different trace statments.
 * Traces are immutable in order to always ensure that probes will always hold valid references to trace
 * statements.
 */
@Entity()
@ObjectType()
export class Trace {
    @Field({ nullable: false })
    @PrimaryGeneratedColumn("uuid")
    readonly id: string;

    @Field({ nullable: false })
    @CreateDateColumn()
    readonly createdAt: Date;

    @Field({ nullable: false })
    @UpdateDateColumn()
    readonly updatedAt: Date;

    @DeleteDateColumn()
    readonly deletedAt: Date;

    @Field((type) => Function, { nullable: false })
    @ManyToOne((type) => Function, { nullable: false })
    function: Promise<Function>;

    @Field({ nullable: false })
    @Index()
    @Column({ nullable: false })
    functionId: number;

    @Field({ nullable: false })
    @Column({ nullable: false })
    statement: string;

    @Field({ nullable: false })
    @Column({ nullable: false })
    active: boolean;

    @Field({ nullable: false })
    @Column({ nullable: false, default: 0 })
    version: number;

    @Column({ nullable: false })
    traceSetId: number;

    @Field((type) => TraceSet, { nullable: false })
    @ManyToOne((type) => TraceSet, { nullable: false })
    traceSet: Promise<TraceSet>;

    @Field((type) => [TraceFailure], { nullable: false })
    @OneToMany((type) => TraceFailure, (traceFailure) => traceFailure.trace)
    traceFailures: Promise<TraceFailure[]>;
}
