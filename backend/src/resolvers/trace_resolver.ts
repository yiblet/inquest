import {
    Resolver,
    Mutation,
    InputType,
    Arg,
    Field,
    PubSub,
    Publisher,
    Subscription,
    Root,
} from "type-graphql";
import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import * as Topics from "../topics";
import { Trace } from "../entities/trace";

@InputType()
class NewTraceInput {
    @Field({ nullable: false })
    module: string;

    @Field({ nullable: false })
    function: string;

    @Field({ nullable: false })
    statement: string;
}

@Resolver((of) => Trace)
export class TraceResolver {
    constructor(
        @InjectRepository(Trace)
        private readonly traceRepository: Repository<Trace>
    ) {}

    @Mutation((returns) => Trace)
    async newTrace(
        @Arg("newTraceInput") newTraceInput: NewTraceInput,
        @PubSub(Topics.TRACES) publish: Publisher<Trace>
    ): Promise<Trace> {
        const trace = await this.traceRepository.save(
            this.traceRepository.create({
                module: newTraceInput.module,
                function: newTraceInput.function,
                statement: newTraceInput.statement,
                active: true,
            })
        );
        await publish(trace);
        return trace;
    }

    @Subscription((returns) => Trace, {
        topics: Topics.TRACES,
    })
    async newTraceSubscription(@Root() trace: Trace): Promise<Trace> {
        return trace;
    }
}
