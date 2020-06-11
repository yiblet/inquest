import { EntityRepository, Repository } from "typeorm";
import { DirectoryInfo } from "../entities";

export function getParentDirName(path: string): string {
    const idx = path.lastIndexOf("/");
    if (idx === -1) {
        return "";
    } else {
        return path.substring(0, idx);
    }
}

@EntityRepository(DirectoryInfo)
export class DirectoryInfoRepository extends Repository<DirectoryInfo> {
    /**
     * retrieves the list of active probes for the given traceset
     */

    async genRootDir(traceSetId: string) {
        const dir = await this.findOne({
            name: "",
            traceSetId: traceSetId,
        });

        if (!dir)
            return await this.save(
                DirectoryInfo.create({
                    name: "",
                    traceSetId: traceSetId,
                })
            );
        else return dir;
    }

    async genRemoveRootDir(traceSetId: string) {
        const dir = await this.findOne({
            name: "",
            traceSetId: traceSetId,
        });
        if (dir) return await this.remove(dir);
    }

    async genDirpath(
        dirpath: string,
        traceSetId: string
    ): Promise<DirectoryInfo> {
        if (dirpath == "") return await this.genRootDir(traceSetId);
        const dir = await this.findOne({
            name: dirpath,
            traceSetId: traceSetId,
        });
        if (dir) return dir;
        const parentDirectory = await this.genDirpath(
            getParentDirName(dirpath),
            traceSetId
        );
        const newDir = DirectoryInfo.create({
            name: dirpath,
            traceSetId: traceSetId,
            parentDirectoryId: parentDirectory.id,
        });
        return await this.save(newDir);
    }
}
