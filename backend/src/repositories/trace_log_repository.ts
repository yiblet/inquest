import {
    EntityManager,
    EntityRepository,
    Repository,
    getManager,
} from "typeorm";
import { TraceLog, TraceLogStatus } from "../entities";
import { InjectRepository } from "typeorm-typedi-extensions";
import { ProbeRepository } from "./probe_repository";
import { PublicError } from "../utils";

@EntityRepository(TraceLog)
export class TraceLogRepository extends Repository<TraceLog> {
    @InjectRepository()
    private probeRepository: ProbeRepository;

    /**
     * retrieves the list of active probes for the given traceset
     */
    async createRelevantLogStatuses(
        traceLog: TraceLog,
        manager: EntityManager | null = null
    ): Promise<TraceLogStatus[]> {
        if (traceLog.id == null) {
            throw new PublicError("trace log unitialized");
        }
        if (manager == null) {
            manager = getManager();
        }
        const probeRepository = manager.getCustomRepository(ProbeRepository);
        const relevantProbeIds = await probeRepository.findActiveProbesIds(
            traceLog.traceSetId
        );

        const newManager: EntityManager = manager;
        // manager has to be reassigned to ensure
        // that it stays not tull in the next line
        return relevantProbeIds.map((id) =>
            newManager.create(
                TraceLogStatus,
                TraceLogStatus.newTraceLogstatus({
                    probeId: id,
                    traceLogId: traceLog.id,
                })
            )
        );
    }
}
