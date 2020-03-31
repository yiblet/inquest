import { Field, ID, ObjectType } from "type-graphql";
import { GraphQLBoolean } from "graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    ManyToMany,
} from "typeorm";

import { Trace } from "./trace";

/**
 * Probe
 * a running instance of an inquest probe
 * TODO probes should be connected to users
 * TODO probes should list which files are currently being logged
 */
@Entity()
@ObjectType()
export class Probe {
    @Field((type) => ID)
    @PrimaryGeneratedColumn()
    readonly id: number;

    @Field()
    @Index()
    @Column()
    last_heartbeat?: Date;

    @Field({ nullable: true })
    @Column({ nullable: true })
    description?: string;

    @Field((type) => GraphQLBoolean, { nullable: false })
    isAlive(): boolean {
        // TODO make this smarter
        if (this.last_heartbeat === null) {
            return false;
        }
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        return twoMinutesAgo >= this.last_heartbeat;
    }

    @Field((type) => [Trace], { nullable: "items" })
    @ManyToMany((type) => Trace, (trace) => trace.probes)
    traces: Trace[];

    // TODO once users are made add this
    // @Field((type) => User)
    // @ManyToOne((type) => User)
    // user: User;
    // @RelationColumn()
    // userId: number;
}
