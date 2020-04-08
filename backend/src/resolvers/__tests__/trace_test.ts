import "reflect-metadata";
import { createSQLiteServer } from "./../../connect";
import { ApolloServer } from "apollo-server";
import { getManager, EntityManager } from "typeorm";
import { Container } from "typedi";
import { ProbeRepository } from "../../repositories/probe_repository";
import { Probe, TraceSet, TraceLog, Trace } from "../../entities";
import {
    createTestClient,
    ApolloServerTestClient,
} from "apollo-server-testing";
import gql from "graphql-tag";

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
        $module: String!
        $function: String!
        $statement: String!
        $key: String!
    ) {
        newTrace(
            newTraceInput: {
                module: $module
                function: $function
                statement: $statement
                traceSetKey: $key
            }
        ) {
            module
            function
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
    beforeAll(async () => {
        Container.reset();
        server = await createSQLiteServer();
        client = createTestClient(server);
        manager = getManager();
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
                        module: "mod",
                        function: "func",
                        statement: "statement",
                        key: "test_key",
                    },
                })
            ).toMatchObject({
                data: {
                    newTrace: {
                        module: "mod",
                        function: "func",
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

            let probe = await manager.save(
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
                        module: "mod",
                        function: "func",
                        statement: "statement",
                        key: traceSet.key,
                    },
                })
            ).toMatchObject({
                data: {
                    newTrace: {
                        module: "mod",
                        function: "func",
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

            expect(await traceLog.traceLogStatuses).toMatchObject([
                { probeId: 1, type: 0 },
            ]);

            probe = await manager.findOne(Probe, {
                where: {
                    id: probe.id,
                },
                relations: ["traceLogStatuses"],
            });

            expect(probe).toMatchObject({
                id: 1,
            });
            expect(await probe.traceLogStatuses).toMatchObject([{}]);
        });
    });

    describe("desired state tests", () => {
        const NEW_TRACE_WITH_DESIRED_STATE = gql`
            mutation newTrace(
                $module: String!
                $function: String!
                $statement: String!
                $key: String!
            ) {
                newTrace(
                    newTraceInput: {
                        module: $module
                        function: $function
                        statement: $statement
                        traceSetKey: $key
                    }
                ) {
                    id
                    module
                    function
                    statement
                    traceSet {
                        key
                        desiredSet {
                            module
                            function
                            statement
                        }
                    }
                }
            }
        `;

        const UPDATE_TRACE_WITH_DESIRED_STATE = gql`
            mutation updateTrace(
                $module: String
                $function: String
                $statement: String
                $active: Boolean
                $id: String!
            ) {
                updateTrace(
                    updateTraceInput: {
                        module: $module
                        function: $function
                        statement: $statement
                        active: $active
                        id: $id
                    }
                ) {
                    id
                    module
                    function
                    statement
                    traceSet {
                        key
                        desiredSet {
                            module
                            function
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
                    module
                    function
                    statement
                    traceSet {
                        key
                        desiredSet {
                            module
                            function
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
                    module: "mod",
                    function: "func",
                    statement: "statement",
                    key: KEY,
                },
            });
            modId = mod1.data.newTrace.id;
            expect(mod1).toMatchObject({
                data: {
                    newTrace: {
                        module: "mod",
                        function: "func",
                        statement: "statement",
                        traceSet: {
                            key: KEY,
                            desiredSet: [
                                {
                                    module: "mod",
                                    function: "func",
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
                    module: "mod2",
                    function: "func",
                    statement: "statement",
                    key: KEY,
                },
            });
            mod2Id = mod2.data.newTrace.id;
            expect(mod2).toMatchObject({
                data: {
                    newTrace: {
                        module: "mod2",
                        function: "func",
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
                    traceSetId: (await manager.findOne(TraceSet, { key: KEY }))
                        .id,
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
                        module: "mod2",
                        function: "func",
                        statement: "statement",
                        traceSet: {
                            key: KEY,
                            desiredSet: [
                                {
                                    module: "mod",
                                    function: "func",
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
                        module: "mod",
                        function: "func",
                        statement: "statements",
                        traceSet: {
                            key: KEY,
                            desiredSet: [
                                {
                                    module: "mod",
                                    function: "func",
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
                        function: "funct",
                        active: true,
                        id: mod2Id,
                    },
                })
            ).toMatchObject({
                data: {
                    updateTrace: {
                        module: "mod2",
                        function: "funct",
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
                        module: "mod2",
                        function: "funct",
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
                        function: "func",
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
