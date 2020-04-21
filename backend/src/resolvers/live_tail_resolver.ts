import {
    Resolver,
    Root,
    Arg,
    Mutation,
    Subscription,
    PubSub,
    PubSubEngine,
} from "type-graphql";
import { EntityManager } from "typeorm";
import { InjectManager } from "typeorm-typedi-extensions";
import { TraceSet } from "../entities";
import { PublicError } from "../utils";
import { genLogTopic } from "../topics";

@Resolver()
export class LiveTailResolver {
    constructor(
        @InjectManager()
        private readonly manager: EntityManager
    ) {}

    @Mutation((type) => String, { nullable: false })
    async publishLog(
        @Arg("traceSetKey") traceSetKey: string,
        @Arg("content") content: string,
        @PubSub() pubsub: PubSubEngine
    ): Promise<string> {
        const tail = await this.manager.findOne(TraceSet, {
            cache: 1000,
            where: {
                key: traceSetKey,
            },
        });

        if (!tail)
            throw new PublicError("traceSetKey doesn't resolve to a valid key");

        await pubsub.publish(genLogTopic(traceSetKey), content);
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
