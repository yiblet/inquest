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
import { plainToClass } from "class-transformer";

/**
 * FileInfo
 * file information
 *
 * id: string
 * required fields:
 *  - name
 *  - objectName
 *  - parentDirectoryId
 *  - md5sum
 *
 * TODO count the number of lines on each file
 *
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
    name: string;

    @Field({ nullable: false })
    @Column()
    md5sum: string;

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

    static create(data: {
        name: string;
        objectName: string;
        parentDirectoryId: string;
        md5sum: string;
    }) {
        return plainToClass(FileInfo, data);
    }
}
