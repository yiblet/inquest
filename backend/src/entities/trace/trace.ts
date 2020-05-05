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
    BeforeUpdate,
} from "typeorm";

import { TraceSet } from "./trace_set";
import { FunctionInfo } from "../code/function_info";
import { ProbeFailure } from "../probe_failure";

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

    @Field((type) => FunctionInfo, { nullable: true })
    @ManyToOne((type) => FunctionInfo, {
        nullable: true,
        onDelete: "SET NULL",
    })
    function: Promise<FunctionInfo | undefined>;

    @Field({ nullable: true })
    @Index()
    @Column({ nullable: true })
    functionId?: string;

    @Field({ nullable: false })
    @Column({ nullable: false })
    statement: string;

    @Field({ nullable: false })
    @Column({ nullable: false, type: "int" })
    line: number;

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

    @Field((type) => [ProbeFailure], { nullable: false })
    @OneToMany((type) => ProbeFailure, (probeFailure) => probeFailure.trace)
    probeFailures: Promise<ProbeFailure[]>;

    @BeforeUpdate()
    deactivateIfOrphaned() {
        if (this.active && this.functionId == null) this.active = false;
    }
}
