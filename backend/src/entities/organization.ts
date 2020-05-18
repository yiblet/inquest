import { Field, ObjectType } from "type-graphql";
import {
    PrimaryGeneratedColumn,
    Column,
    Entity,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from "typeorm";
import { TraceSet, User } from ".";
import { plainToClass } from "class-transformer";

@ObjectType()
@Entity()
export class Organization {
    @Column({ nullable: false })
    @PrimaryGeneratedColumn("uuid")
    readonly id: string;

    @Field({ nullable: false })
    @CreateDateColumn()
    readonly createdAt: Date;

    @Field({ nullable: false })
    @UpdateDateColumn()
    readonly updatedAt: Date;

    @Field((type) => [TraceSet], { nullable: false })
    @OneToMany((type) => TraceSet, (traceSet) => traceSet.organization)
    traceSets: Promise<TraceSet[]>;

    @Field((type) => [User], { nullable: false })
    @OneToMany((type) => User, (user) => user.organization)
    users: Promise<User[]>;

    static create(data: { name: string }) {
        return plainToClass(Organization, data);
    }
}
