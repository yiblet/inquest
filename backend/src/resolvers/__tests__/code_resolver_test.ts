import { ModuleInput, CodeResolver } from "../code_resolver";
import { connectTypeOrm } from "../../connect";
import { Container } from "typedi";
import { EntityManager, getManager } from "typeorm";
import { UploadService } from "../../services/upload";
import { StorageService } from "../../services/storage";
import { stubObject, StubbedInstance } from "ts-sinon";
import { File } from "../../entities";
import { plainToClass } from "class-transformer";

describe("partially mocking the UploadService", () => {
    let manager: EntityManager;
    let file: File;
    let storageStub: StubbedInstance<StorageService>;
    let uploadService: UploadService;
    beforeAll(async () => {
        await connectTypeOrm();
        manager = getManager();
        file = await manager.save(
            manager.create(File, {
                name: "test",
                objectName: "test",
            })
        );
        storageStub = stubObject<StorageService>(new StorageService());
        new UploadService(manager, storageStub);
    });

    afterEach(() => {
        storageStub = stubObject<StorageService>(new StorageService());
    });

    it("should create a new module", async () => {
        const codeResolver = new CodeResolver(manager, uploadService);

        const input = plainToClass(ModuleInput, {
            childFunctions: [],
            childClasses: [],
            fileId: file.id,
            lines: 20,
            name: "test_module",
        });

        await expect(codeResolver.createModule(input)).resolves.toMatchObject({
            name: "test_module",
            fileId: file.id,
            endLine: input.lines,
        });
    });

    it("should create a complex module", async () => {
        const codeResolver = new CodeResolver(manager, uploadService);

        const input = plainToClass(ModuleInput, {
            childFunctions: [
                { name: "test_function", startLine: 3, endLine: 5 },
                { name: "test_function2", startLine: 3, endLine: 5 },
            ],
            childClasses: [
                { name: "TestClass", startLine: 3, endLine: 5, methods: [] },
                {
                    name: "TestClass",
                    startLine: 3,
                    endLine: 5,
                    methods: [
                        { name: "test_method", startLine: 4, endLine: 6 },
                    ],
                },
            ],
            fileId: file.id,
            lines: 20,
            name: "test_module2",
        });

        const module = await codeResolver.createModule(input);
        expect(module).toMatchObject({
            name: "test_module2",
            fileId: file.id,
            endLine: input.lines,
        });

        await expect(module.childFunctions).resolves.toMatchObject([
            { name: "test_function", startLine: 3, endLine: 5 },
            { name: "test_function2", startLine: 3, endLine: 5 },
        ]);

        await expect(module.childClasses).resolves.toMatchObject([
            { name: "TestClass", startLine: 3, endLine: 5 },
            { name: "TestClass", startLine: 3, endLine: 5 },
        ]);
    });
});
