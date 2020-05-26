import { DebugConnector } from "../../connect";
import Container from "typedi";
import {
    getParentDirName,
    DirectoryInfoRepository,
} from "../directory_info_repository";
import { getManager } from "typeorm";
import { seedTriple } from "../../helpers";

beforeAll(async () => {
    Container.reset();
    await new DebugConnector().connect();
});

it("test get parentDirectoryectoryName", () => {
    expect(getParentDirName("abc/def")).toBe("abc");
    expect(getParentDirName("abc/def/ghij")).toBe("abc/def");
    expect(getParentDirName("abc")).toBe("");
});

it("test generate dirpath", async () => {
    const manager = getManager();
    const dirRepo = manager.getCustomRepository(DirectoryInfoRepository);

    const { traceSet } = await seedTriple("org1");
    const obj = await dirRepo.genDirpath("abc/def/ghij", traceSet.id);
    const parent1 = await obj.parentDirectory;
    const parent2 = parent1 && (await parent1.parentDirectory);
    const parent3 = parent2 && (await parent2.parentDirectory);
    expect(obj).toMatchObject({
        name: "abc/def/ghij",
    });
    expect(parent1).toMatchObject({
        name: "abc/def",
    });
    expect(parent2).toMatchObject({
        name: "abc",
    });
    expect(parent3).toMatchObject({
        name: "",
    });
});
