import { Field, ObjectType } from "type-graphql";
import {
    Entity,
    ManyToOne,
    Column,
    OneToMany,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "typeorm";

import { ClassInfo } from "./class_info";
import { Trace } from "../trace/trace";
import { GraphQLInt } from "graphql";
import { FileInfo } from "./file_info";

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
export class FunctionInfo {
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
    @Column({ nullable: false })
    readonly name: string;

    @Field((type) => GraphQLInt, { nullable: false })
    @Column({ nullable: false, type: "int" })
    readonly startLine: number;

    @Field((type) => GraphQLInt, { nullable: false })
    @Column({ nullable: false, type: "int" })
    readonly endLine: number;

    @Field((type) => FileInfo, { nullable: false })
    @ManyToOne((type) => FileInfo, { nullable: false, onDelete: "CASCADE" })
    file: Promise<FileInfo>;

    @Index()
    @Column({ nullable: false })
    fileId: string;

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
