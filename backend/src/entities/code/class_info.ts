import { Field, ObjectType } from "type-graphql";
import { Entity, OneToMany } from "typeorm";
import { AbstractPythonNode } from "./abstract_python_node";
import { FunctionInfo } from "./function_info";

/**
 * Class
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
export class ClassInfo extends AbstractPythonNode {
    @Field((type) => [FunctionInfo], { nullable: false })
    @OneToMany((type) => FunctionInfo, (func) => func.parentClass, {
        nullable: false,
        onDelete: "CASCADE",
    })
    methods: Promise<FunctionInfo[]>;
}
