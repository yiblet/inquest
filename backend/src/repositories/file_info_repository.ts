import { EntityRepository, Repository, IsNull } from "typeorm";
import { FileInfo, FunctionInfo, ClassInfo } from "../entities";
import { createTransaction } from "../utils";

@EntityRepository(FileInfo)
export class FileInfoRepository extends Repository<FileInfo> {
    /**
     * retrieves the list of active probes for the given traceset
     */
    async removeContents(file: FileInfo) {
        return await createTransaction(this.manager, async (manager) => {
            const fileInfoRepo = manager.getCustomRepository(
                FileInfoRepository
            );

            const [classes, functions] = await Promise.all([
                fileInfoRepo.classes(file),
                fileInfoRepo.functions(file),
            ]);
            await manager.remove([...classes, ...functions]);
        });
    }

    /**
     * returns the top level functions available on this file
     */
    async functions(file: FileInfo): Promise<FunctionInfo[]> {
        return await this.manager.find(FunctionInfo, {
            parentClassId: IsNull(),
            fileId: file.id,
        });
    }

    /**
     * returns the top level classes available on this file
     */
    async classes(file: FileInfo): Promise<ClassInfo[]> {
        return await this.manager.find(ClassInfo, {
            fileId: file.id,
        });
    }
}
