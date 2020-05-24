import { Field, ObjectType } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    Column,
} from "typeorm";

import { Organization } from "../organization";
import { plainToClass } from "class-transformer";

/**
 * TraceSet the current desired set of all active statements
 */
@Entity()
@ObjectType()
export class TraceSet {
    @Field({ nullable: false })
    @PrimaryGeneratedColumn("uuid")
    readonly id: string;

    @Field({ nullable: false })
    @CreateDateColumn()
    readonly createdAt: Date;

    @Field({ nullable: false })
    @UpdateDateColumn()
    readonly updatedAt: Date;

    @Field((type) => [Organization], { nullable: false })
    @ManyToOne((type) => Organization, (org) => org.traceSets)
    organization: Promise<Organization>;

    @Column()
    organizationId: string;

    static create(data: { organizationId: string }) {
        return plainToClass(TraceSet, data);
    }
}
