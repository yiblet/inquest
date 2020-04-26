import { EntityManager } from "typeorm";
import { Service, Inject } from "typedi";
import { InjectManager } from "typeorm-typedi-extensions";
import { FileInfo } from "../entities";
import { StorageService } from "./storage";
import { v4 as uuidv4 } from "uuid";
import {
    DirectoryInfoRepository,
    getParentDirName,
} from "../repositories/directory_info_repository";
import { FileInfoRepository } from "../repositories/file_info_repository";
import { PublicError, createTransaction } from "../utils";

@Service()
export class UploadService {
    constructor(
        @InjectManager()
        private manager: EntityManager,
        @Inject((type) => StorageService)
        private storageService: StorageService
    ) {}

    /**
     * saves the file (by default overwriting the existing file)
     * TODO add tests for this operation
     * TODO this doesn't delete removed directories
     */
    private async saveFile(name: string, objectName: string, overwrite = true) {
        return createTransaction(this.manager, async (manager) => {
            const dirpath = getParentDirName(name);
            const directoryInfoRepository = manager.getCustomRepository(
                DirectoryInfoRepository
            );
            const fileInfoRepository = manager.getCustomRepository(
                FileInfoRepository
            );

            let file = await manager.findOne(FileInfo, { name: name });
            if (file && overwrite) {
                await Promise.all([
                    fileInfoRepository.removeContents(file),
                    this.storageService.remove(file.objectName),
                ]);
                file.objectName = objectName;
            } else if (file && !overwrite) {
                throw new PublicError("file already exists");
            } else {
                const parentDirectory = await directoryInfoRepository.genDirpath(
                    dirpath
                );
                file = manager.create(FileInfo, {
                    name: name,
                    objectName: objectName,
                    parentDirectoryId: parentDirectory.id,
                });
            }

            return await manager.save(file);
        });
    }

    /**
     * returns the number of lines in this file
     * TODO count the number of lines on each file
     */
    lineCount(buffer: Buffer) {
        let lineCount = -1;
        let idx = -1;
        do {
            idx = buffer.indexOf(10, idx + 1);
            lineCount++;
        } while (idx !== -1);
        return lineCount;
    }

    async upload(name: string, blob: Buffer) {
        const objectName: string = uuidv4();
        return (
            await Promise.all([
                this.saveFile(name, objectName),
                this.storageService.save(objectName, blob),
            ])
        )[0];
    }
}
