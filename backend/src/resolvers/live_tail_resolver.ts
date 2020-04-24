import {
    Resolver,
    Root,
    Arg,
    Mutation,
    Subscription,
    PubSub,
    PubSubEngine,
    Ctx,
} from "type-graphql";
import { EntityManager } from "typeorm";
import { InjectManager } from "typeorm-typedi-extensions";
import { genLogTopic } from "../topics";
import { Context, retrieveProbe } from "../context";

@Resolver()
export class LiveTailResolver {
    constructor(
        @InjectManager()
        private readonly manager: EntityManager
    ) {}

    @Mutation((type) => String, { nullable: false })
    async publishLog(
        @Arg("content") content: string,
        @Ctx() context: Context,
        @PubSub() pubsub: PubSubEngine
    ): Promise<string> {
        const probe = retrieveProbe(context);
        const tail = await probe.traceSet;
        await pubsub.publish(genLogTopic(tail.key), content);
        return content;
    }

    @Subscription((type) => String, {
        nullable: false,
        topics: ({ args }) => genLogTopic(args.traceSetKey),
    })
    listenLog(
        @Arg("traceSetKey") traceSetKey: string,
        @Root() content: string
    ): string {
        return content;
    }
}
