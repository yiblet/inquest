import { Field, ObjectType } from "type-graphql";
import {
    Entity,
    OneToMany,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "typeorm";
import { FunctionInfo } from "./function_info";
import { GraphQLInt } from "graphql";
import { FileInfo } from "./file_info";

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
export class ClassInfo {
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
