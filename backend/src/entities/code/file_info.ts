import { Field, ObjectType } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Column,
    ManyToOne,
} from "typeorm";
import { DirectoryInfo } from "./directory_info";

/**
 * FileInfo
 * file information
 *
 * id: string
 * required fields:
 *  - name
 *  - objectName
 *
 * TODO count the number of lines on each file
 */
@Entity()
@ObjectType()
export class FileInfo {
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

    @Column()
    objectName: string;

    @Field((type) => DirectoryInfo, { nullable: false })
    @ManyToOne((type) => DirectoryInfo, {
        nullable: false,
        onDelete: "CASCADE",
    })
    parentDirectory: Promise<DirectoryInfo>;

    @Column({ nullable: false })
    parentDirectoryId: string;
}
