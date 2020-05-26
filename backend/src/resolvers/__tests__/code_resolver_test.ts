import { CodeResolver, FileContentInput } from "../code_resolver";
import { DebugConnector } from "../../connect";
import { Container } from "typedi";
import { EntityManager, getManager } from "typeorm";
import { UploadService } from "../../services/upload";
import { FileInfo, TraceSet } from "../../entities";
import { plainToClass } from "class-transformer";
import { FileResolver } from "../file_resolver";
import { StorageService } from "../../services/storage";
import { DirectoryInfoRepository } from "../../repositories/directory_info_repository";
import { seedTriple } from "../../helpers";

describe("setting up dummy file", () => {
    let manager: EntityManager;
    let rootDirId: string;
    let traceSet: TraceSet;
    beforeAll(async () => {
        await new DebugConnector().connect();
        manager = getManager();
        traceSet = (await seedTriple("test1")).traceSet;
        const dirRepo = manager.getCustomRepository(DirectoryInfoRepository);
        rootDirId = (await dirRepo.genRootDir(traceSet.id)).id;
    });

    it("should create a new module", async () => {
        const file = await manager.save(
            FileInfo.create({
                name: "test1",
                objectName: "test",
                parentDirectoryId: rootDirId,
                md5sum: "randomSum",
                traceSetId: traceSet.id,
            })
        );
        const codeResolver = new CodeResolver(
            manager,
            Container.get(UploadService)
        );

        const input = plainToClass(FileContentInput, {
            functions: [],
            classes: [],
            fileId: file.id,
        });

        await expect(codeResolver.newFileContent(input)).resolves.toMatchObject(
            {
                id: file.id,
                name: "test1",
                objectName: "test",
            }
        );
    });

    it("should create a complex module", async () => {
        const file = await manager.save(
            FileInfo.create({
                name: "test2",
                objectName: "test",
                parentDirectoryId: rootDirId,
                md5sum: "randomSum",
                traceSetId: traceSet.id,
            })
        );
        const codeResolver = new CodeResolver(
            manager,
            Container.get(UploadService)
        );

        const fileResolver = new FileResolver(
            manager,
            Container.get(StorageService)
        );

        const input = plainToClass(FileContentInput, {
            functions: [
                { name: "test_function", startLine: 3, endLine: 4 },
                { name: "test_function2", startLine: 3, endLine: 4 },
            ],
            classes: [
                {
                    name: "TestClass",
                    startLine: 3,
                    endLine: 4,
                    methods: [],
                    classes: [],
                },
                {
                    name: "TestClass",
                    startLine: 3,
                    endLine: 4,
                    methods: [
                        { name: "test_method", startLine: 3, endLine: 4 },
                    ],
                    classes: [],
                },
            ],
            fileId: file.id,
        });

        const module = await codeResolver.newFileContent(input);
        expect(module).toMatchObject({
            id: file.id,
        });

        await expect(fileResolver.functions(file)).resolves.toMatchObject([
            { name: "test_function", startLine: 3, endLine: 4 },
            { name: "test_function2", startLine: 3, endLine: 4 },
        ]);

        await expect(fileResolver.classes(file)).resolves.toMatchObject([
            { name: "TestClass", startLine: 3, endLine: 4 },
            { name: "TestClass", startLine: 3, endLine: 4 },
        ]);
    });
});
