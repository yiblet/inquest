import { Resolver, FieldResolver, Root, Arg, Query } from "type-graphql";
import { Inject } from "typedi";
import { StorageService } from "../services/storage";

import { File } from "../entities";
import { EntityManager } from "typeorm";
import { InjectManager } from "typeorm-typedi-extensions";

@Resolver((of) => File)
export class FileResolver {
    constructor(
        @InjectManager()
        private readonly manager: EntityManager,
        @Inject((type) => StorageService)
        private readonly storageService: StorageService
    ) {}

    @Query((type) => File, { nullable: true })
    async file(@Arg("fileId") fileId: string): Promise<File> {
        return await this.manager.findOne(File, fileId);
    }

    @FieldResolver((type) => String, { nullable: false })
    async content(@Root() file: File): Promise<string> {
        return await StorageService.streamToString(
            await this.storageService.load(file.objectName)
        );
    }
}
