import { Field, ObjectType } from "type-graphql";
import { Entity, ManyToOne, Column } from "typeorm";

import { AbstractPythonNode } from "./abstract_python_node";
import { Module } from "./module";
import { Class } from "./class";

/**
 * Function
 *
 * a python function is either part of a module or part of a class
 */
@Entity()
@ObjectType()
export class Function extends AbstractPythonNode {
    @Field((type) => Class, { nullable: true })
    @ManyToOne((type) => Class)
    parentClass: Promise<Class>;

    @Column({ nullable: true })
    parentClassId: number;

    @Field((type) => Module, { nullable: true })
    @ManyToOne((type) => Module)
    module: Promise<Module>;

    @Column({ nullable: true })
    moduleId: number;
}
