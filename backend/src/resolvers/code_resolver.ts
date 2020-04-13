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
    start_line: number;
    @Field({ nullable: false })
    end_line: number;
}

@InputType()
class FunctionInput extends NodeInputWithLines {
    @Field()
    metadata: string;
}

@InputType()
class ClassInput extends NodeInputWithLines {
    @Field((type) => [FunctionInput], { nullable: false })
    methods: FunctionInput[];
}

@InputType() // introduces a bug with module names being unique
class ModuleInput extends NodeInput {
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
        functionInput: FunctionInput
    ): Function {
        const functionPartial: DeepPartial<Function> = classToPlain(
            functionInput
        );
        return manager.create(Function, functionPartial);
    }

    static createClass(manager: EntityManager, classInput: ClassInput): Class {
        const plain = classToPlain(classInput);
        const classPartial: DeepPartial<Class> & typeof plain = {
            ...plain,
            methods: Promise.resolve(
                classInput.methods.map((input) =>
                    CodeResolver.createFunction(manager, input)
                )
            ),
        };
        return manager.create(Class, classPartial);
    }

    @Mutation((_) => Module, { nullable: false })
    async createModule(@Arg("module") module: ModuleInput) {
        return await this.manager.transaction(async (manager) => {
            const file = await manager.findOne(File, module.fileId);
            if (!file) throw new PublicError("could not find file");

            const modulePartial: DeepPartial<Module> = {
                childFunctions: Promise.resolve(
                    module.childFunctions.map((input) =>
                        manager.create(Function, classToPlain(input))
                    )
                ),
                childClasses: Promise.resolve(
                    module.childClasses.map((input) =>
                        CodeResolver.createClass(manager, input)
                    )
                ),
                name: module.name,
                startLine: 1,
                endLine: module.lines,
                file: Promise.resolve(file),
            };
            return await manager.save(Module, modulePartial);
        });
    }
}
