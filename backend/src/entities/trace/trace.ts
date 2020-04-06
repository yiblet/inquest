import { Field, ObjectType } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    Index,
} from "typeorm";

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

    @Field({ nullable: false })
    @Index()
    @Column({ nullable: false })
    module: string;

    @Field({ nullable: false })
    @Column({ nullable: false })
    function: string;

    @Field({ nullable: false })
    @Column({ nullable: false })
    statement: string;
}
