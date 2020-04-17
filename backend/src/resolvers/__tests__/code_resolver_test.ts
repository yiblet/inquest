import { ModuleInput, CodeResolver } from "../code_resolver";
import { connectTypeOrm } from "../../connect";
import { Container } from "typedi";
import { EntityManager, getManager } from "typeorm";
import { UploadService } from "../../services/upload";
import { File, Module } from "../../entities";
import { plainToClass } from "class-transformer";

describe("setting up dummy file", () => {
    let manager: EntityManager;
    let file: File;
    beforeAll(async () => {
        await connectTypeOrm();
        manager = getManager();
        file = await manager.save(
            manager.create(File, {
                name: "test",
                objectName: "test",
            })
        );
    });

    it("should create a new module", async () => {
        const codeResolver = new CodeResolver(
            manager,
            Container.get(UploadService)
        );

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
        const codeResolver = new CodeResolver(
            manager,
            Container.get(UploadService)
        );

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
            name: "test_module.test_module2",
            parentModuleName: "test_module",
        });

        const module = await codeResolver.createModule(input);
        expect(module).toMatchObject({
            name: "test_module.test_module2",
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

        expect(
            await manager.findOne(Module, { name: "test_module" })
        ).toMatchObject(await module.parentModule);
    });
});
