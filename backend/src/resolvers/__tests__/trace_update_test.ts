import "reflect-metadata";
import { createSQLiteServer } from "./../../connect";
import { assertNotNull } from "../../utils";
import { ApolloServer } from "apollo-server";
import { getManager, EntityManager } from "typeorm";
import { Container } from "typedi";
import {
    NewTraceWithState,
    NewTraceWithStateVariables,
} from "../../generated/NewTraceWithState";
import { TraceSet, FunctionInfo, FileInfo, Trace } from "../../entities";
import gql from "graphql-tag";
import { DirectoryInfoRepository } from "../../repositories/directory_info_repository";
import {
    createWrappedTestClient,
    TestClientWrapper,
    GQLResponse,
} from "../../utils/testing";
import { UpdateTrace, UpdateTraceVariables } from "../../generated/UpdateTrace";
import { DeleteTrace, DeleteTraceVariables } from "../../generated/DeleteTrace";
import { seedTriple } from "../../helpers";

describe("testing server", () => {
    let server: ApolloServer;
    let client: TestClientWrapper;
    let manager: EntityManager;
    let func1: FunctionInfo;
    let func2: FunctionInfo;
    let traceSet: TraceSet;
    beforeAll(async () => {
        Container.reset();
        server = await createSQLiteServer();
        client = createWrappedTestClient(server);
        manager = getManager();
        const dirRepo = manager.getCustomRepository(DirectoryInfoRepository);

        const triple = await seedTriple("test1");
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

    describe("desired state tests", () => {
        const NEW_TRACE_WITH_DESIRED_STATE = gql`
            mutation NewTraceWithState(
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
            mutation UpdateTrace(
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
                        id
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
            mutation DeleteTrace($id: String!) {
                deleteTrace(traceId: $id) {
                    id
                    function {
                        name
                    }
                    statement
                    traceSet {
                        id
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

        let modId = "";
        let mod2Id = "";

        it("desired set should have one object", async () => {
            const mod1: GQLResponse<NewTraceWithState> = await client.mutate<
                NewTraceWithState,
                NewTraceWithStateVariables
            >({
                mutation: NEW_TRACE_WITH_DESIRED_STATE,
                variables: {
                    functionId: func1.id,
                    line: 2,
                    statement: "statement",
                    id: traceSet.id,
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
                            id: traceSet.id,
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
            const mod2 = await client.mutate<
                NewTraceWithState,
                NewTraceWithStateVariables
            >({
                mutation: NEW_TRACE_WITH_DESIRED_STATE,
                variables: {
                    functionId: func2.id,
                    line: 2,
                    statement: "statement",
                    id: traceSet.id,
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
                            id: traceSet.id,
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
                        await manager.findOne(TraceSet, { id: traceSet.id })
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
                await client.mutate<UpdateTrace, UpdateTraceVariables>({
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
                            id: traceSet.id,
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
                await client.mutate<UpdateTrace, UpdateTraceVariables>({
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
                            id: traceSet.id,
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
                await client.mutate<UpdateTrace, UpdateTraceVariables>({
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
                            id: traceSet.id,
                            desiredSet: [{}, {}],
                        },
                    },
                },
                errors: undefined,
            });
        });

        it("delete trace should lose mod2 now permanently", async () => {
            expect(
                await client.mutate<DeleteTrace, DeleteTraceVariables>({
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
                            id: traceSet.id,
                            desiredSet: [{}],
                        },
                    },
                },
                errors: undefined,
            });
        });

        it("connecting to that trace should now fail", async () => {
            expect(
                await client.mutate<DeleteTrace, DeleteTraceVariables>({
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
                await client.mutate<UpdateTrace, UpdateTraceVariables>({
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
