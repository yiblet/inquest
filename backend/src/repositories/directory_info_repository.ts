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

    async genRootDir() {
        const dir = await this.findOne({
            name: "",
        });
        if (!dir)
            return await this.save(
                this.create({
                    name: "",
                })
            );
        else return dir;
    }

    async genDirpath(dirpath: string): Promise<DirectoryInfo> {
        if (dirpath == "") return await this.genRootDir();
        const dir = await this.findOne({
            name: dirpath,
        });
        if (dir) return dir;
        const parentDirectory = await this.genDirpath(
            getParentDirName(dirpath)
        );
        return await this.save(
            this.create({
                name: dirpath,
                parentDirectoryId: parentDirectory.id,
            })
        );
    }
}
