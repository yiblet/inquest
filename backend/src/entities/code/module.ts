import { Field, ObjectType } from "type-graphql";
import { Entity, Index, Column, OneToMany, ManyToOne } from "typeorm";
import { AbstractPythonNode } from "./abstract_python_node";
import { Function } from "./function";
import { Class } from "./class";

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

    @Field((type) => [Module], { nullable: false })
    @OneToMany((type) => Module, (module) => module.parentModule, {
        nullable: true,
    })
    subModules: Promise<Module[] | undefined>;

    @Field((type) => Module, { nullable: true })
    @ManyToOne((type) => Module, {
        nullable: true,
    })
    parentModule: Promise<Module | undefined>;

    @Column({ nullable: true })
    parentModuleId?: number;
}
