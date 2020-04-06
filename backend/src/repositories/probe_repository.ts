import { EntityRepository, Repository, MoreThanOrEqual } from "typeorm";
import { Probe } from "../entities";
import { subMinutes } from "date-fns";

@EntityRepository(Probe)
export class ProbeRepository extends Repository<Probe> {
    /**
     * retrieves the list of active probes for the given traceset
     */
    async findActiveProbesIds(traceSetId: number): Promise<number[]> {
        return (
            await this.find({
                select: ["id"],
                where: {
                    traceSetId: traceSetId,
                    lastHeartbeat: MoreThanOrEqual(subMinutes(new Date(), 5)),
                },
            })
        ).map((probe) => probe.id);
    }
}
