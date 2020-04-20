import { Field, ObjectType } from "type-graphql";
import { Entity, ManyToOne, OneToMany, Column } from "typeorm";

import { AbstractPythonNode } from "./abstract_python_node";
import { Function } from "./function";
import { Module } from "./module";

/**
 * Class
 */
@Entity()
@ObjectType()
export class Class extends AbstractPythonNode {
    @Field((type) => [Function], { nullable: false })
    @OneToMany((type) => Function, (func) => func.parentClass)
    methods: Promise<Function[]>;

    @Field((type) => Module, { nullable: false })
    @ManyToOne((type) => Module)
    module: Promise<Module>;

    @Column()
    moduleId: number;
}
