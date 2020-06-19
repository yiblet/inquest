import { EntityRepository, Repository, IsNull } from "typeorm";
import { FileInfo, FunctionInfo, ClassInfo } from "../entities";

@EntityRepository(FileInfo)
export class FileInfoRepository extends Repository<FileInfo> {
    /**
     * retrieves the list of active probes for the given traceset
     */
    async removeContents(file: FileInfo) {
        const [classes, functions] = await Promise.all([
            this.classes(file),
            this.functions(file),
        ]);
        await this.manager.remove([...classes, ...functions]);
    }

    /**
     * find the subset info the input files that are different compared to
     * what's in the database
     */
    async findDifferences(
        traceSetId: string,
        sums: { [file: string]: string }
    ) {
        const files = await this.createQueryBuilder("file_info")
            .where(
                // (:...names) spreads the names out
                "file_info.name IN (:...names) AND file_info.traceSetId = :traceSetId",
                {
                    names: Object.keys(sums),
                    traceSetId,
                }
            )
            .getMany();

        const fileMap = new Map<string, FileInfo>();
        for (const file of files) {
            fileMap.set(file.name, file);
        }

        return Object.entries(sums)
            .filter(([name, md5sum]) => {
                const file = fileMap.get(name);
                return !file || file.md5sum !== md5sum;
            })
            .map(([name]) => name);
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
