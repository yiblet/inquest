import { Field, ObjectType } from "type-graphql";
import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    Column,
} from "typeorm";

import { FileInfo } from "./file_info";
import { GraphQLInt } from "graphql";

/**
 * AbstractPythonNode
 */
@ObjectType()
export abstract class AbstractPythonNode {
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
    readonly line: number;

    @Field((type) => FileInfo, { nullable: false })
    @ManyToOne((type) => FileInfo, { nullable: false, onDelete: "CASCADE" })
    file: Promise<FileInfo>;

    @Index()
    @Column({ nullable: false })
    fileId: string;
}
