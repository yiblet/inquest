import { Field, ID, ObjectType } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    ManyToMany,
} from "typeorm";

import { Probe } from "./probe";

/**
 * Trace
 * a module, function tuple defining a function being traced
 * TODO probes should be connected to user
 * TODO probes should list which files are currently being logged
 */
@Entity()
@ObjectType()
export class Trace {
    @Field((type) => ID)
    @PrimaryGeneratedColumn()
    readonly id: number;

    @Field({ nullable: false })
    @Index()
    @Column({ nullable: false })
    module: string;

    @Field({ nullable: false })
    @Column({ nullable: false })
    func: string; //avoiding calling it function because that's a reserved word

    @Field({ nullable: false })
    @Column({ nullable: false })
    active: string; //avoiding calling it function because that's a reserved word

    @Field((type) => [Probe], { nullable: "items" })
    @ManyToMany((type) => Probe, (probe) => probe.traces)
    probes: Probe[];
}
