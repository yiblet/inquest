import {
    Resolver,
    FieldResolver,
    Root,
    Arg,
    Query,
    Mutation,
    Ctx,
} from "type-graphql";
import { Inject } from "typedi";
import { StorageService, streamToString } from "../services/storage";

import { FileInfo, FunctionInfo, ClassInfo } from "../entities";
import { EntityManager } from "typeorm";
import { InjectManager } from "typeorm-typedi-extensions";
import { FileInfoRepository } from "../repositories/file_info_repository";
import { Context } from "../context";
import { DirectoryInfoRepository } from "../repositories/directory_info_repository";

@Resolver((of) => FileInfo)
export class FileResolver {
    private readonly fileInfoRepository: FileInfoRepository;
    private readonly directoryInfoRepository: DirectoryInfoRepository;
    constructor(
        @InjectManager()
        private readonly manager: EntityManager,
        @Inject((type) => StorageService)
        private readonly storageService: StorageService
    ) {
        this.fileInfoRepository = manager.getCustomRepository(
            FileInfoRepository
        );
        this.directoryInfoRepository = manager.getCustomRepository(
            DirectoryInfoRepository
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
        return await streamToString(
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

    @Mutation((type) => Boolean, {
        nullable: false,
        description:
            "returns true if the root directory was removed false if it didn't exist in the first place",
    })
    async removeRootDirectory(@Ctx() context: Context): Promise<boolean> {
        const traceSetId = (await context.traceSet()).id;
        return !!(await this.directoryInfoRepository.genRemoveRootDir(
            traceSetId
        ));
    }
}
