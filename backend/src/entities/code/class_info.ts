import { Field, ObjectType } from "type-graphql";
import { Entity, OneToMany, Column, ManyToOne } from "typeorm";
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
    })
    methods: Promise<FunctionInfo[]>;

    @Field((type) => ClassInfo, { nullable: true })
    @ManyToOne((type) => ClassInfo, { nullable: true, onDelete: "CASCADE" })
    parentClass: Promise<ClassInfo | undefined>;

    @Column({ nullable: true })
    parentClassId?: string;

    @Field((type) => [ClassInfo], { nullable: false })
    @OneToMany((type) => ClassInfo, (func) => func.parentClass, {
        nullable: false,
    })
    subClasses: Promise<ClassInfo[]>;
}
