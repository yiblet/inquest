import {
    Resolver,
    Query,
    Mutation,
    Ctx,
    InputType,
    Arg,
    Field,
    PubSub,
    Publisher,
} from "type-graphql";
import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import * as Topics from "../topics";
import { User } from "../entities/user";
import { Trace } from "../entities/trace";
import { Context } from "../context";

@InputType()
class NewTraceInput {
    @Field({ nullable: false })
    module: string;

    @Field({ nullable: false })
    function: string;
}

@Resolver((of) => User)
export class UserResolver {
    constructor(
        @InjectRepository(User)
        private readonly probeRepository: Repository<User>,
        @InjectRepository(Trace)
        private readonly traceRepository: Repository<Trace>
    ) {}

    @Query((returns) => User, { nullable: true })
    async me(@Ctx() { user }: Context): Promise<User> {
        return user;
    }

    @Mutation((returns) => Trace)
    async newTrace(
        @Arg("newTraceInput") newTraceInput: NewTraceInput,
        @PubSub(Topics.TRACES) publish: Publisher<Trace>
    ): Promise<Trace> {
        const trace = await this.traceRepository.save(
            this.traceRepository.create({
                module: newTraceInput.module,
                func: newTraceInput.function,
            })
        );
        await publish(trace);
        return trace;
    }
}
