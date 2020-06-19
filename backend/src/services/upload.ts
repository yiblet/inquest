import { EntityManager } from "typeorm";
import { Service, Inject } from "typedi";
import { FileInfo } from "../entities";
import { StorageService } from "./storage";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";
import {
    DirectoryInfoRepository,
    getParentDirName,
} from "../repositories/directory_info_repository";
import { FileInfoRepository } from "../repositories/file_info_repository";
import { PublicError } from "../utils";
import { logger } from "../logging";

enum FileState {
    NEW_FILE = "NEW_FILE",
    UNCHANGED_FILE = "UNCHANGED_FILE",
    OVERWRITE_FILE = "OVERWRITE_FILE",
    ALREADY_EXISTS_ERROR = "ALREADY_EXISTS_ERROR",
}

@Service()
export class UploadService {
    constructor(
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
        manager: EntityManager,
        name: string,
        objectName: string,
        md5sum: string,
        traceSetId: string,
        blob: Buffer,
        overwrite = true
    ): Promise<FileInfo> {
        const dirpath = getParentDirName(name);
        const directoryInfoRepository = manager.getCustomRepository(
            DirectoryInfoRepository
        );
        const fileInfoRepository = manager.getCustomRepository(
            FileInfoRepository
        );

        let file = await manager.findOne(FileInfo, {
            name: name,
            traceSetId,
        });

        // setting this up as a switch statement makes it extremely readable
        const fileState = UploadService.getFileState(file, overwrite, md5sum);
        logger.debug("file state", {
            name: name,
            state: fileState,
        });
        switch (fileState) {
            case FileState.NEW_FILE: {
                const parentDirectory = await directoryInfoRepository.genDirpath(
                    dirpath,
                    traceSetId
                );
                file = FileInfo.create({
                    name: name,
                    objectName: objectName,
                    parentDirectoryId: parentDirectory.id,
                    traceSetId,
                    md5sum,
                });
                await this.storageService.save(objectName, blob);
                file = await manager.save(file);
                logger.debug("file saved", file);
                return file;
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
                await this.storageService.save(objectName, blob);
                file = await manager.save(file);
                logger.debug("file overwritten", file);
                return file;
            }
            case FileState.UNCHANGED_FILE:
                if (!file) throw new Error("file should not be null");
                return file;
            default:
                throw new Error("unexpected case");
        }
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

    /**
     * upload will send the file to the blob store if the buffer publishes a new file
     */
    async upload(
        manager: EntityManager,
        name: string,
        traceSetId: string,
        blob: Buffer
    ) {
        const objectName: string = uuidv4();
        // TODO change from md5 -> sha256
        const sum = createHash("md5").update(blob).digest("hex");
        return await this.saveFile(
            manager,
            name,
            objectName,
            sum,
            traceSetId,
            blob
        );
    }
}
