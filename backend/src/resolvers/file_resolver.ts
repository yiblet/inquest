import { Resolver, FieldResolver, Root, Arg, Query } from "type-graphql";
import { Inject } from "typedi";
import { StorageService } from "../services/storage";

import { FileInfo, FunctionInfo, ClassInfo } from "../entities";
import { EntityManager } from "typeorm";
import { InjectManager } from "typeorm-typedi-extensions";
import { FileInfoRepository } from "../repositories/file_info_repository";

@Resolver((of) => FileInfo)
export class FileResolver {
    private readonly fileInfoRepository: FileInfoRepository;
    constructor(
        @InjectManager()
        private readonly manager: EntityManager,
        @Inject((type) => StorageService)
        private readonly storageService: StorageService
    ) {
        this.fileInfoRepository = manager.getCustomRepository(
            FileInfoRepository
        );
    }

    @Query((type) => FileInfo, { nullable: true })
    async file(
        /* eslint-disable */
        @Arg("fileId", (type) => String, { nullable: true })
        fileId: string
        /* eslint-enable */
    ): Promise<FileInfo | undefined> {
        return await this.manager.findOne(FileInfo, fileId);
    }

    @FieldResolver((type) => String, { nullable: false })
    async content(@Root() file: FileInfo): Promise<string> {
        return await StorageService.streamToString(
            await this.storageService.load(file.objectName)
        );
    }

    @FieldResolver((type) => [FunctionInfo], { nullable: false })
    async functions(@Root() file: FileInfo): Promise<FunctionInfo[]> {
        return this.fileInfoRepository.functions(file);
    }

    @FieldResolver((type) => [ClassInfo], { nullable: false })
    async classes(@Root() file: FileInfo): Promise<ClassInfo[]> {
        return this.fileInfoRepository.classes(file);
    }
}
