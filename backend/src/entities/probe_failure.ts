import { Field, ObjectType } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    Column,
} from "typeorm";

import { Trace } from "./trace/trace";
import { Probe } from "./probe";

/**
 * ProbeFailure appears when traces have failures
 * probes will report these failures and send them back to the parent
 *
 * id : number
 * initalization requires:
 *  - message
 *  - probeId
 */
@Entity()
@ObjectType()
export class ProbeFailure {
    @PrimaryGeneratedColumn()
    readonly id: number;

    @Field({ nullable: false })
    @CreateDateColumn()
    readonly createdAt: Date;

    @Field({ nullable: false })
    @UpdateDateColumn()
    readonly updatedAt: Date;

    @Field({ nullable: false })
    @Column({ nullable: false })
    readonly message: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    traceVersion?: number;

    /**
     * the respective Trace
     */
    @Field((type) => Trace, { nullable: false })
    @ManyToOne((type) => Trace, { nullable: false })
    trace: Promise<Trace | undefined>;

    @Index()
    @Column({ nullable: true })
    traceId?: string;

    /**
     * the respective probe
     */
    @Field((type) => Probe, { nullable: false })
    @ManyToOne((type) => Probe, { nullable: false })
    probe: Promise<Probe>;

    @Index()
    @Column({ nullable: false })
    probeId: number;
}
