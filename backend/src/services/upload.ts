import { EntityManager } from "typeorm";
import { Service, Inject } from "typedi";
import { InjectManager } from "typeorm-typedi-extensions";
import { FileInfo } from "../entities";
import { StorageService } from "./storage";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";
import {
    DirectoryInfoRepository,
    getParentDirName,
} from "../repositories/directory_info_repository";
import { FileInfoRepository } from "../repositories/file_info_repository";
import { PublicError, createTransaction } from "../utils";

enum FileState {
    NEW_FILE,
    UNCHANGED_FILE,
    OVERWRITE_FILE,
    ALREADY_EXISTS_ERROR,
}

@Service()
export class UploadService {
    constructor(
        @InjectManager()
        private manager: EntityManager,
        @Inject((type) => StorageService)
        private storageService: StorageService
    ) {}

    private static getFileState(
        file: FileInfo | undefined,
        overwrite: boolean,
        md5sum: string
    ) {
        if (file) {
            if (file.md5sum == md5sum) return FileState.UNCHANGED_FILE;
            else if (overwrite) return FileState.OVERWRITE_FILE;
            else return FileState.ALREADY_EXISTS_ERROR;
        }
        return FileState.NEW_FILE;
    }

    /**
     * saves the file (by default overwriting the existing file)
     * TODO add tests for this operation
     * TODO this doesn't delete removed directories
     */
    private async saveFile(
        name: string,
        objectName: string,
        md5sum: string,
        overwrite = true
    ): Promise<[FileInfo, boolean]> {
        return createTransaction(
            this.manager,
            async (manager): Promise<[FileInfo, boolean]> => {
                const dirpath = getParentDirName(name);
                const directoryInfoRepository = manager.getCustomRepository(
                    DirectoryInfoRepository
                );
                const fileInfoRepository = manager.getCustomRepository(
                    FileInfoRepository
                );

                let file = await manager.findOne(FileInfo, { name: name });

                switch (UploadService.getFileState(file, overwrite, md5sum)) {
                    case FileState.NEW_FILE: {
                        const parentDirectory = await directoryInfoRepository.genDirpath(
                            dirpath
                        );

                        const file = FileInfo.create({
                            name: name,
                            objectName: objectName,
                            parentDirectoryId: parentDirectory.id,
                            md5sum,
                        });
                        return [await manager.save(file), true];
                    }
                    case FileState.ALREADY_EXISTS_ERROR:
                        throw new PublicError("file already exists");
                    case FileState.OVERWRITE_FILE: {
                        if (!file) throw new Error("file should not be null");
                        await Promise.all([
                            fileInfoRepository.removeContents(file),
                            this.storageService.remove(file.objectName),
                        ]);
                        file.objectName = objectName;
                        return [await manager.save(file), true];
                    }
                    case FileState.UNCHANGED_FILE:
                        if (!file) throw new Error("file should not be null");
                        return [file, false];
                    default:
                        throw new Error("unexpected case");
                }
            }
        );
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
        const sum = createHash("md5").update(blob).digest("hex");

        const [file, changed] = await this.saveFile(name, objectName, sum);
        if (changed) {
            await this.storageService.save(objectName, blob);
        }
        return file;
    }
}
