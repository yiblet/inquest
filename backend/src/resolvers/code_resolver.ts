import { Resolver, Mutation, InputType, Arg, Field } from "type-graphql";
import { EntityManager, DeepPartial } from "typeorm";
import { Inject } from "typedi";
import { InjectManager } from "typeorm-typedi-extensions";

import { File, Module, Function, Class } from "../entities";
import { GraphQLUpload, FileUpload } from "graphql-upload";
import { UploadService } from "../services/upload";
import { classToPlain } from "class-transformer";
import { PublicError } from "../utils";

@InputType({ isAbstract: true })
abstract class NodeInput {
    @Field({ nullable: false })
    name: string;
}

@InputType({ isAbstract: true })
class NodeInputWithLines extends NodeInput {
    @Field({ nullable: false })
    startLine: number;
    @Field({ nullable: false })
    endLine: number;
}

@InputType()
export class FunctionInput extends NodeInputWithLines {
    @Field()
    metadata: string;
}

@InputType()
export class ClassInput extends NodeInputWithLines {
    @Field((type) => [FunctionInput], { nullable: false })
    methods: FunctionInput[];
}

@InputType() // introduces a bug with module names being unique
export class ModuleInput extends NodeInput {
    @Field((type) => [FunctionInput], { nullable: false })
    childFunctions: FunctionInput[];
    @Field((type) => [ClassInput], { nullable: false })
    childClasses: ClassInput[];
    @Field({ nullable: true })
    parentModuleName: string;
    @Field({ nullable: false })
    fileId: string;
    @Field({ nullable: false })
    lines: number;
}

@Resolver()
export class CodeResolver {
    constructor(
        @InjectManager()
        private readonly manager: EntityManager,
        @Inject()
        private readonly uploadService: UploadService
    ) {}

    @Mutation((_) => File, { nullable: false })
    async fileUpload(@Arg("file", () => GraphQLUpload) fileUpload: FileUpload) {
        return await this.uploadService.upload(
            fileUpload.filename,
            fileUpload.createReadStream()
        );
    }

    static createFunction(
        manager: EntityManager,
        functionInput: FunctionInput,
        extra: Partial<Function>
    ): Function {
        const functionPartial: DeepPartial<Function> = classToPlain(
            functionInput
        );
        return manager.create(Function, { ...functionPartial, ...extra });
    }

    static async saveClass(
        manager: EntityManager,
        classInput: ClassInput,
        extra: Partial<Class>
    ): Promise<Class> {
        const plain = classToPlain(classInput);
        const classPartial: DeepPartial<Class> & typeof plain = {
            ...plain,
            ...extra,
        };
        const classObject = await manager.save(
            manager.create(Class, classPartial)
        );
        const methods = classInput.methods.map((input) =>
            CodeResolver.createFunction(manager, input, {
                fileId: classObject.fileId,
                parentClassId: classObject.id,
            })
        );
        return classObject;
    }

    @Mutation((_) => Module, { nullable: false })
    async createModule(@Arg("module") module: ModuleInput): Promise<Module> {
        return await this.manager.transaction(async (manager) => {
            const file = await manager.findOne(File, module.fileId);
            if (!file) throw new PublicError("could not find file");

            const moduleObject: Module = await manager.save(
                manager.create(Module, {
                    name: module.name,
                    startLine: 1,
                    endLine: module.lines,
                    fileId: file.id,
                })
            );

            await Promise.all([
                Promise.all(
                    module.childClasses.map((input) =>
                        CodeResolver.saveClass(manager, input, {
                            fileId: file.id,
                            moduleId: moduleObject.id,
                        })
                    )
                ),
                manager.save(
                    module.childFunctions.map((input) =>
                        CodeResolver.createFunction(manager, input, {
                            fileId: file.id,
                            moduleId: moduleObject.id,
                        })
                    )
                ),
            ]);

            return moduleObject;
        });
    }
}
