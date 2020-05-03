import "reflect-metadata";
import { createSQLiteServer } from "./../../connect";
import { assertNotNull } from "../../utils";
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
    Trace,
} from "../../entities";
import {
    createTestClient,
    ApolloServerTestClient,
} from "apollo-server-testing";
import gql from "graphql-tag";
import { DirectoryInfoRepository } from "../../repositories/directory_info_repository";

const FIND_TRACE_SET = gql`
    query traceSetQuery($key: String!) {
        traceSet(traceSetKey: $key) {
            key
        }
    }
`;

export const NEW_TRACE_SET = gql`
    mutation newTraceSet($key: String!) {
        newTraceSet(traceSetKey: $key) {
            key
        }
    }
`;

const NEW_TRACE = gql`
    mutation newTrace(
        $functionId: String!
        $statement: String!
        $key: String!
        $line: Int!
    ) {
        newTrace(
            newTraceInput: {
                functionId: $functionId
                statement: $statement
                traceSetKey: $key
                line: $line
            }
        ) {
            function {
                name
            }
            statement
            traceSet {
                key
            }
        }
    }
`;

describe("testing server", () => {
    let server: ApolloServer;
    let client: ApolloServerTestClient;
    let manager: EntityManager;
    let func1: FunctionInfo;
    let func2: FunctionInfo;
    beforeAll(async () => {
        Container.reset();
        server = await createSQLiteServer();
        client = createTestClient(server);
        manager = getManager();
        const dirRepo = manager.getCustomRepository(DirectoryInfoRepository);
        const rootDirId = (await dirRepo.genRootDir()).id;

        const file = await manager.save(
            manager.create(FileInfo, {
                name: "test_file",
                objectName: "test_object",
                parentDirectoryId: rootDirId,
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

        func2 = await manager.save(
            manager.create(FunctionInfo, {
                name: "func2",
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

    it("should fail to find trace set object", async () => {
        expect(
            await client.mutate({
                mutation: FIND_TRACE_SET,
                variables: {
                    key: "test",
                },
            })
        ).toMatchObject({
            data: { traceSet: null },
            errors: undefined,
        });
    });

    it("should create new trace set object", async () => {
        expect(
            await client.mutate({
                mutation: NEW_TRACE_SET,
                variables: {
                    key: "test",
                },
            })
        ).toMatchObject({
            data: {
                newTraceSet: {
                    key: "test",
                },
            },
            errors: undefined,
        });
    });

    it("should find trace set object", async () => {
        expect(
            await client.mutate({
                mutation: FIND_TRACE_SET,
                variables: {
                    key: "test",
                },
            })
        ).toMatchObject({
            data: {
                traceSet: {
                    key: "test",
                },
            },
            errors: undefined,
        });
    });

    describe("new trace tests", () => {
        it("should create new trace object", async () => {
            expect(
                await client.mutate({
                    mutation: NEW_TRACE_SET,
                    variables: {
                        key: "test_key",
                    },
                })
            ).toMatchObject({ data: { newTraceSet: { key: "test_key" } } });

            expect(
                await client.mutate({
                    mutation: NEW_TRACE,
                    variables: {
                        functionId: func1.id,
                        line: 2,
                        statement: "statement",
                        key: "test_key",
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
        it("should fail to create trace set object", async () => {
            expect(
                await client.mutate({
                    mutation: NEW_TRACE_SET,
                    variables: {
                        key: "test_key2",
                    },
                })
            ).toMatchObject({
                data: { newTraceSet: { key: "test_key2" } },
                errors: undefined,
            });

            expect(
                await client.mutate({
                    mutation: NEW_TRACE_SET,
                    variables: {
                        key: "test_key2",
                    },
                })
            ).toMatchObject({
                data: null,
                errors: [{}],
            });
        });

        it("secondary objects should have been created", async () => {
            const traceSet = await manager.save(
                manager.create(TraceSet, {
                    key: "test-key",
                })
            );

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

            expect(
                await client.mutate({
                    mutation: NEW_TRACE,
                    variables: {
                        functionId: func1.id,
                        line: 2,
                        statement: "statement",
                        key: traceSet.key,
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

            expect(
                await probeRepository.findActiveProbesIds(traceSet.id)
            ).toMatchObject([{}]);

            const traceLog = await manager.findOne(TraceLog, {
                relations: ["traceLogStatuses"],
                where: {
                    traceSetId: traceSet.id,
                },
                order: {
                    updatedAt: "DESC",
                },
            });

            expect(traceLog).toBeTruthy();
            if (!traceLog) throw new Error("tracelog should be truthy");

            expect(await traceLog.traceLogStatuses).toMatchObject([
                { probeId: 1, type: 0 },
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
                id: 1,
            });

            expect(await newProbe.traceLogStatuses).toMatchObject([{}]);
        });
    });

    describe("desired state tests", () => {
        const NEW_TRACE_WITH_DESIRED_STATE = gql`
            mutation newTrace(
                $functionId: String!
                $statement: String!
                $key: String!
                $line: Int!
            ) {
                newTrace(
                    newTraceInput: {
                        functionId: $functionId
                        statement: $statement
                        traceSetKey: $key
                        line: $line
                    }
                ) {
                    id
                    function {
                        name
                    }
                    statement
                    traceSet {
                        key
                        desiredSet {
                            function {
                                name
                            }
                            statement
                        }
                    }
                }
            }
        `;

        const UPDATE_TRACE_WITH_DESIRED_STATE = gql`
            mutation updateTrace(
                $statement: String
                $active: Boolean
                $id: String!
            ) {
                updateTrace(
                    updateTraceInput: {
                        statement: $statement
                        active: $active
                        id: $id
                    }
                ) {
                    id
                    function {
                        name
                    }
                    statement
                    traceSet {
                        key
                        desiredSet {
                            function {
                                name
                            }
                            statement
                        }
                    }
                }
            }
        `;

        const DELETE_TRACE_WITH_DESIRED_STATE = gql`
            mutation deleteTrace($id: String!) {
                deleteTrace(traceId: $id) {
                    id
                    function {
                        name
                    }
                    statement
                    traceSet {
                        key
                        desiredSet {
                            function {
                                name
                            }
                            statement
                        }
                    }
                }
            }
        `;

        const KEY = "test-key2";
        let modId = "";
        let mod2Id = "";

        it("trace set should have been created", async () => {
            const traceSet = await manager.save(
                manager.create(TraceSet, {
                    key: KEY,
                })
            );
            expect(traceSet).toMatchObject({ key: KEY });
        });

        it("desired set should have one object", async () => {
            const mod1 = await client.mutate({
                mutation: NEW_TRACE_WITH_DESIRED_STATE,
                variables: {
                    functionId: func1.id,
                    line: 2,
                    statement: "statement",
                    key: KEY,
                },
            });
            if (!mod1.data) throw new Error(`${mod1.errors}`);
            modId = mod1.data.newTrace.id;
            expect(mod1).toMatchObject({
                data: {
                    newTrace: {
                        function: {
                            name: "func1",
                        },
                        statement: "statement",
                        traceSet: {
                            key: KEY,
                            desiredSet: [
                                {
                                    function: {
                                        name: "func1",
                                    },
                                    statement: "statement",
                                },
                            ],
                        },
                    },
                },
                errors: undefined,
            });
        });

        it("desired set should have two object", async () => {
            const mod2 = await client.mutate({
                mutation: NEW_TRACE_WITH_DESIRED_STATE,
                variables: {
                    functionId: func2.id,
                    line: 2,
                    statement: "statement",
                    key: KEY,
                },
            });
            if (!mod2.data) throw new Error(`${mod2.errors}`);
            mod2Id = mod2.data.newTrace.id;
            expect(mod2).toMatchObject({
                data: {
                    newTrace: {
                        function: {
                            name: "func2",
                        },
                        statement: "statement",
                        traceSet: {
                            key: KEY,
                            desiredSet: [{}, {}],
                        },
                    },
                },
                errors: undefined,
            });
        });

        it("desired set should come out in reverse updated order", async () => {
            const traces = await manager.find(Trace, {
                where: {
                    traceSetId: assertNotNull(
                        await manager.findOne(TraceSet, { key: KEY })
                    ).id,
                    active: true,
                },
                order: {
                    updatedAt: "DESC",
                },
            });

            expect(traces).toMatchObject([{}, {}]);

            expect(traces[1].updatedAt.valueOf()).toBeLessThanOrEqual(
                traces[0].updatedAt.valueOf()
            );
        });

        it("desired set should lose one object", async () => {
            expect(
                await client.mutate({
                    mutation: UPDATE_TRACE_WITH_DESIRED_STATE,
                    variables: {
                        active: false,
                        id: mod2Id,
                    },
                })
            ).toMatchObject({
                data: {
                    updateTrace: {
                        function: {
                            name: "func2",
                        },
                        statement: "statement",
                        traceSet: {
                            key: KEY,
                            desiredSet: [
                                {
                                    function: {
                                        name: "func1",
                                    },
                                    statement: "statement",
                                },
                            ],
                        },
                    },
                },
                errors: undefined,
            });
        });

        it("desired set should have statements change", async () => {
            expect(
                await client.mutate({
                    mutation: UPDATE_TRACE_WITH_DESIRED_STATE,
                    variables: {
                        statement: "statements",
                        id: modId,
                    },
                })
            ).toMatchObject({
                data: {
                    updateTrace: {
                        function: {
                            name: "func1",
                        },
                        statement: "statements",
                        traceSet: {
                            key: KEY,
                            desiredSet: [
                                {
                                    function: {
                                        name: "func1",
                                    },
                                    statement: "statements",
                                },
                            ],
                        },
                    },
                },
                errors: undefined,
            });
        });

        it("desired set should have gain mod2 again", async () => {
            expect(
                await client.mutate({
                    mutation: UPDATE_TRACE_WITH_DESIRED_STATE,
                    variables: {
                        active: true,
                        id: mod2Id,
                    },
                })
            ).toMatchObject({
                data: {
                    updateTrace: {
                        function: {
                            name: "func2",
                        },
                        statement: "statement",
                        traceSet: {
                            key: KEY,
                            desiredSet: [{}, {}],
                        },
                    },
                },
                errors: undefined,
            });
        });

        it("delete trace should lose mod2 now permanently", async () => {
            expect(
                await client.mutate({
                    mutation: DELETE_TRACE_WITH_DESIRED_STATE,
                    variables: {
                        id: mod2Id,
                    },
                })
            ).toMatchObject({
                data: {
                    deleteTrace: {
                        function: {
                            name: "func2",
                        },
                        statement: "statement",
                        traceSet: {
                            key: KEY,
                            desiredSet: [{}],
                        },
                    },
                },
                errors: undefined,
            });
        });

        it("connecting to that trace should now fail", async () => {
            expect(
                await client.mutate({
                    mutation: DELETE_TRACE_WITH_DESIRED_STATE,
                    variables: {
                        id: mod2Id,
                    },
                })
            ).toMatchObject({
                data: null,
                errors: [{}],
            });

            expect(
                await client.mutate({
                    mutation: UPDATE_TRACE_WITH_DESIRED_STATE,
                    variables: {
                        statement: "func",
                        id: mod2Id,
                    },
                })
            ).toMatchObject({
                data: null,
                errors: [{}],
            });
        });
    });
});
