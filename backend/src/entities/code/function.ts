import { Field, ObjectType } from "type-graphql";
import { Entity, ManyToOne, Column, OneToMany } from "typeorm";

import { AbstractPythonNode } from "./abstract_python_node";
import { Module } from "./module";
import { Class } from "./class";
import { Trace } from "../trace/trace";

/**
 * Function
 *
 * a python function is either part of a module or part of a class
 */
@Entity()
@ObjectType()
export class Function extends AbstractPythonNode {
    @Field((type) => Class, { nullable: true })
    @ManyToOne((type) => Class, { nullable: true })
    parentClass: Promise<Class | undefined>;

    @Column({ nullable: true })
    parentClassId?: number;

    @Field((type) => Module, { nullable: true })
    @ManyToOne((type) => Module, { nullable: true })
    module: Promise<Module | undefined>;

    @Column({ nullable: true })
    moduleId?: number;

    @Field((type) => [Trace], { nullable: false })
    @OneToMany((type) => Trace, (trace) => trace.function, { nullable: false })
    traces: Promise<Trace[]>;
}
