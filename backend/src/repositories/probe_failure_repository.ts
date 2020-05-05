import { EntityRepository, Repository } from "typeorm";
import { ProbeFailure, Probe } from "../entities";

@EntityRepository(ProbeFailure)
export class ProbeFailureRepository extends Repository<ProbeFailure> {
    /**
     * findExistingFailure retrieves the existing failure
     */
    async findExistingFailure(probeFailure: ProbeFailure, probe: Probe) {
        if (probeFailure.traceId !== undefined) {
            return await this.findOne({
                traceId: probeFailure.traceId,
                traceVersion: probeFailure.traceVersion,
                message: probeFailure.message,
            });
        } else {
            return await this.createQueryBuilder("failure")
                .innerJoin(
                    "failure.probe",
                    "probe",
                    "probe.traceSetId = :traceSetId",
                    { traceSetId: probe.traceSetId }
                )
                .where("failure.message = :message", {
                    message: probeFailure.message,
                })
                .getOne();
        }
    }

    /**
     * findExistingFailure retrieves the existing failure
     */
    buildIncludedTrace() {
        return this.createQueryBuilder("failure").innerJoin(
            "failure.trace",
            "trace",
            "probe.traceVersion = trace.version"
        );
    }
}
