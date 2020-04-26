import { Field, ObjectType } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Column,
    ManyToOne,
    OneToMany,
} from "typeorm";
import { FileInfo } from "./file_info";

/**
 * DirectoryInfo
 *
 * id: string
 * required fields:
 *  - name
 */
@Entity()
@ObjectType()
export class DirectoryInfo {
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
    @Index({ unique: true })
    @Column()
    readonly name: string;

    @Field((type) => [DirectoryInfo], { nullable: false })
    @OneToMany((type) => DirectoryInfo, (dir) => dir.parentDirectory, {
        nullable: false,
    })
    subDirectories: Promise<DirectoryInfo[]>;

    @Field((type) => DirectoryInfo, { nullable: true })
    @ManyToOne((type) => DirectoryInfo, { nullable: true, onDelete: "CASCADE" })
    parentDirectory: Promise<DirectoryInfo | undefined>;

    @Column({ nullable: true })
    parentDirectoryId?: string;

    @Field((type) => [FileInfo], { nullable: false })
    @OneToMany((type) => FileInfo, (dir) => dir.parentDirectory, {
        nullable: false,
    })
    files: Promise<FileInfo[]>;
}
