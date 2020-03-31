import {
    Resolver,
    Query,
    Arg,
    Mutation,
    Subscription,
    Root,
} from "type-graphql";
import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { GraphQLString } from "graphql";
import * as Topics from "../topics";
import { Probe } from "../entities/probe";
import { Trace } from "../entities/trace";

@Resolver((of) => Probe)
export class ProbeResolver {
    constructor(
        @InjectRepository(Probe)
        private readonly probeRepository: Repository<Probe>,
        @InjectRepository(Trace)
        private readonly traceRepository: Repository<Trace>
    ) {}

    @Query((returns) => Probe, { nullable: true })
    probe(@Arg("key", (_) => GraphQLString) key: string) {
        return this.probeRepository.findOne({
            where: {
                key,
            },
        });
    }

    @Mutation((returns) => Probe)
    async heartbeat(
        @Arg("key", (_) => GraphQLString) key: string
    ): Promise<Probe> {
        const probe = await this.probeRepository.findOne({
            where: {
                key,
            },
        });
        if (probe === null) {
            throw new Error("probe does not exist");
        }
        probe.lastHeartbeat = new Date();
        return await this.probeRepository.save(probe);
    }

    @Mutation((returns) => Probe)
    async newProbe(): Promise<Probe> {
        return await this.probeRepository.save(this.probeRepository.create({}));
    }

    @Subscription((returns) => Trace, {
        topics: Topics.TRACES,
    })
    async newTrace(@Root() trace: Trace): Promise<Trace> {
        return trace;
    }
}
