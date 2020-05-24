import "reflect-metadata";
import { createSQLiteServer } from "./../../connect";
import { ApolloServer } from "apollo-server";
import { getManager, EntityManager } from "typeorm";
import { Container } from "typedi";
import { ProbeRepository } from "../../repositories/probe_repository";
import {
    Probe,
    TraceSet,
    TraceLog,
    FunctionInfo,
    FileInfo,
} from "../../entities";
import gql from "graphql-tag";
import { DirectoryInfoRepository } from "../../repositories/directory_info_repository";
import {
    createWrappedTestClient,
    TestClientWrapper,
} from "../../utils/testing";
import { NewTrace, NewTraceVariables } from "../../generated/NewTrace";
import { seedTriple } from "../../helpers";

export const NEW_TRACE_SET = gql`
    mutation NewTraceSet {
        newTraceSet {
            id
        }
    }
`;

const NEW_TRACE = gql`
    mutation NewTrace(
        $functionId: String!
        $statement: String!
        $id: String!
        $line: Int!
    ) {
        newTrace(
            newTraceInput: {
                functionId: $functionId
                statement: $statement
                traceSetId: $id
                line: $line
            }
        ) {
            id
            function {
                name
            }
            statement
            traceSet {
                id
            }
        }
    }
`;

describe("testing server", () => {
    let server: ApolloServer;
    let client: TestClientWrapper;
    let manager: EntityManager;
    let func1: FunctionInfo;
    let traceSet: TraceSet;
    beforeAll(async () => {
        Container.reset();
        server = await createSQLiteServer();
        client = createWrappedTestClient(server);
        manager = getManager();
        const dirRepo = manager.getCustomRepository(DirectoryInfoRepository);

        const triple = await seedTriple("36916e4f-095b-410d-9a0d-0dad5acf6328"); // random uuid
        traceSet = triple.traceSet;
        const rootDirId = (await dirRepo.genRootDir(traceSet.id)).id;

        const file = await manager.save(
            FileInfo.create({
                name: "test_file",
                objectName: "test_object",
                parentDirectoryId: rootDirId,
                md5sum: "random sum",
                traceSetId: traceSet.id,
            })
        );

        func1 = await manager.save(
            manager.create(FunctionInfo, {
                name: "func1",
                startLine: 4,
                endLine: 5,
                fileId: file.id,
            })
        );
    });

    afterAll(async () => {
        await server.stop();
        Container.reset();
    });

    describe("new trace tests", () => {
        it("should create new trace object", async () => {
            const id = traceSet.id;

            expect(
                await client.mutate<NewTrace, NewTraceVariables>({
                    mutation: NEW_TRACE,
                    variables: {
                        functionId: func1.id,
                        line: 2,
                        statement: "statement",
                        id,
                    },
                })
            ).toMatchObject({
                data: {
                    newTrace: {
                        function: {
                            name: "func1",
                        },
                        statement: "statement",
                    },
                },
                errors: undefined,
            });
        });

        it("secondary objects should have been created", async () => {
            const probe = await manager.save(
                manager.create(Probe, {
                    traceSetId: traceSet.id,
                    lastHeartbeat: new Date(),
                })
            );

            const probeRepository = manager.getCustomRepository(
                ProbeRepository
            );
            expect(
                await probeRepository.findActiveProbesIds(traceSet.id)
            ).toMatchObject([{}]);

            const data = await client.mutate<NewTrace, NewTraceVariables>({
                mutation: NEW_TRACE,
                variables: {
                    functionId: func1.id,
                    line: 2,
                    statement: "statement",
                    id: traceSet.id,
                },
            });

            expect(data).toMatchObject({
                data: {
                    newTrace: {
                        function: {
                            name: "func1",
                        },
                        statement: "statement",
                    },
                },
                errors: undefined,
            });

            expect(
                await probeRepository.findActiveProbesIds(traceSet.id)
            ).toMatchObject([{}]);

            const traceLog = await manager.findOne(TraceLog, {
                where: {
                    traceSetId: traceSet.id,
                    traceId: data.data?.newTrace.id,
                },
                order: {
                    updatedAt: "DESC",
                },
            });

            expect(traceLog).toBeTruthy();
            if (!traceLog) throw new Error("tracelog should be truthy");

            expect(await traceLog.traceLogStatuses).toMatchObject([
                { probeId: probe.id, type: 0 },
            ]);

            const newProbe = await manager.findOne(Probe, {
                where: {
                    id: probe.id,
                },
                relations: ["traceLogStatuses"],
            });
            expect(newProbe).toBeTruthy();
            if (!newProbe) throw new Error("probe should be truthy");

            expect(newProbe).toMatchObject({
                id: probe.id,
            });

            expect(await newProbe.traceLogStatuses).toMatchObject([{}]);
        });
    });
});
