import { Field, ObjectType } from "type-graphql";
import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    Column,
} from "typeorm";

import { File } from "./file";

/**
 * AbstractPythonNode
 */
@ObjectType()
export abstract class AbstractPythonNode {
    @PrimaryGeneratedColumn()
    readonly id: number;

    @Field({ nullable: false })
    @CreateDateColumn()
    readonly createdAt: Date;

    @Field({ nullable: false })
    @UpdateDateColumn()
    readonly updatedAt: Date;

    @Field({ nullable: false })
    @Column({ nullable: false })
    readonly name: string;

    @Field({ nullable: false })
    @Column({ nullable: false })
    readonly startLine: number;

    @Field({ nullable: false })
    @Column({ nullable: false })
    readonly endLine: number;

    @Field((type) => File, { nullable: false })
    @ManyToOne((type) => File, { nullable: false })
    file: Promise<File>;

    @Index()
    @Column({ nullable: false })
    fileId: string;
}
