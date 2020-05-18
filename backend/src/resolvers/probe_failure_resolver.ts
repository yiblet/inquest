import { Resolver, Field, InputType, Arg, Ctx, Mutation } from "type-graphql";
import { EntityManager } from "typeorm";
import { InjectManager } from "typeorm-typedi-extensions";

import { ProbeFailure, Trace } from "../entities";
import { Context } from "../context";
import { createTransaction, PublicError } from "../utils";
import { ProbeFailureRepository } from "../repositories/probe_failure_repository";

@InputType()
class NewProbeFailureInput {
    @Field({ nullable: true })
    traceId?: string;
    @Field({ nullable: false })
    message: string;
}

@Resolver((of) => ProbeFailure)
export class ProbeFailureResolver {
    constructor(
        @InjectManager()
        private readonly manager: EntityManager
    ) {}

    /**
     * createFailure creates a failure instance
     * NOTE: THIS DOES NOT SAVE THE INSTANCE TO THE DB
     */
    private async createFailure(
        { traceId, message }: NewProbeFailureInput,
        context: Context,
        manager: EntityManager
    ) {
        const probe = context.probe;
        const failure = manager.create(ProbeFailure, {
            message,
            probeId: probe.id,
        });

        if (traceId) {
            const trace = await manager.getRepository(Trace).findOne({
                where: { id: traceId },
            });
            if (trace == null) {
                throw new PublicError("could not find trace with that id");
            }
            failure.traceId = traceId;
            failure.traceVersion = trace.version;
        }
        return failure;
    }

    @Mutation((returns) => ProbeFailure)
    async newProbeFailure(
        @Arg("newProbeFailure") input: NewProbeFailureInput,
        @Ctx() context: Context
    ): Promise<ProbeFailure> {
        return await createTransaction(this.manager, async (manager) => {
            const probeFailureRepository = manager.getCustomRepository(
                ProbeFailureRepository
            );

            const probe = context.probe;
            const failure = await this.createFailure(input, context, manager);

            const existingFailure = await probeFailureRepository.findExistingFailure(
                failure,
                probe
            );

            if (!existingFailure) return await manager.save(failure);
            return existingFailure;
        });
    }
}
