import { Field, ObjectType } from "type-graphql";
import { Entity, Index, Column, OneToMany, ManyToOne } from "typeorm";
import { AbstractPythonNode } from "./abstract_python_node";
import { Function } from "./function";
import { Class } from "./class";
import { File } from "./file";

/**
 * Module
 */
@Entity()
@ObjectType()
export class Module extends AbstractPythonNode {
    @Field((type) => [Function], { nullable: "items" })
    @OneToMany((type) => Function, (func) => func.module)
    childFunctions: Promise<Function[]>;

    @Field({ nullable: false })
    @Index()
    @Column({ unique: true })
    readonly name: string;

    @Field((type) => [Class], { nullable: "items" })
    @OneToMany((type) => Class, (cls) => cls.module)
    childClasses: Promise<Class[]>;

    @Field((type) => [Module], { nullable: "items" })
    @OneToMany((type) => Module, (module) => module.parentModule, {
        nullable: true,
    })
    subModules: Promise<Module[]>;

    @Field((type) => Module, { nullable: true })
    @ManyToOne((type) => Module, {
        nullable: true,
    })
    parentModule: Promise<Module>;

    @Column({ nullable: true })
    parentModuleId: number;

    @Field((type) => File, { nullable: false })
    @ManyToOne((type) => File, {
        nullable: false,
    })
    file: Promise<File>;
}
