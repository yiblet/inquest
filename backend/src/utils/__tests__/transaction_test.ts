import { DebugConnector } from "../../connect";
import { Container } from "typedi";
import { EntityManager, getManager } from "typeorm";
import { UploadService } from "../../services/upload";
import { FileInfo, TraceSet } from "../../entities";
import { plainToClass } from "class-transformer";
import { StorageService } from "../../services/storage";
import { DirectoryInfoRepository } from "../../repositories/directory_info_repository";
import { seedTriple } from "../../helpers";
import { createTransaction } from "..";

describe("setting up dummy file", () => {
    let manager: EntityManager;
    beforeAll(async () => {
        await new DebugConnector().connect();
        manager = getManager();
    });

    it("test if transaction is active in nested transaction", async () => {
        await expect(
            createTransaction(
                manager,
                async (manager) =>
                    manager.queryRunner &&
                    manager.queryRunner.isTransactionActive
            )
        ).resolves.toBeTruthy();
    });
});
