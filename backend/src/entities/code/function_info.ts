import { Field, ObjectType } from "type-graphql";
import { Entity, ManyToOne, Column, OneToMany } from "typeorm";

import { AbstractPythonNode } from "./abstract_python_node";
import { ClassInfo } from "./class_info";
import { Trace } from "../trace/trace";

/**
 * Function
 * a python function is either part of a module or part of a class
 *
 * id: string
 *
 * required fields:
 *  - fileId
 *  - name
 *  - line
 */
@Entity()
@ObjectType()
export class FunctionInfo extends AbstractPythonNode {
    @Field((type) => ClassInfo, { nullable: true })
    @ManyToOne((type) => ClassInfo, { nullable: true, onDelete: "CASCADE" })
    parentClass: Promise<ClassInfo | undefined>;

    @Column({ nullable: true })
    parentClassId?: string;

    @Field((type) => [Trace], { nullable: false })
    @OneToMany((type) => Trace, (trace) => trace.function, {
        nullable: false,
    })
    traces: Promise<Trace[]>;

    @Field((type) => Boolean, { nullable: false })
    isMethod() {
        return this.parentClassId == null;
    }
}
