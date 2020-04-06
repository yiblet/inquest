import { createSQLiteServer } from "./../../connect";
import { ApolloServer } from "apollo-server";
import { getManager, EntityManager } from "typeorm";
import { Container } from "typedi";
import { ProbeRepository } from "../../repositories/probe_repository";
import { Probe, TraceState, TraceLog } from "../../entities";
import {
    createTestClient,
    ApolloServerTestClient,
} from "apollo-server-testing";
import gql from "graphql-tag";

const FIND_TRACE_STATE = gql`
    query traceStateQuery($key: String!) {
        traceState(traceStateKey: $key) {
            key
        }
    }
`;

export const NEW_TRACE_STATE = gql`
    mutation newTraceState($key: String!) {
        newTraceState(traceStateKey: $key) {
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
                traceStateKey: $key
            }
        ) {
            module
            function
            statement
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

    it("should fail to find trace state object", async () => {
        expect(
            await client.mutate({
                mutation: FIND_TRACE_STATE,
                variables: {
                    key: "test",
                },
            })
        ).toMatchObject({
            data: { traceState: null },
            errors: undefined,
        });
    });

    it("should create new trace state object", async () => {
        expect(
            await client.mutate({
                mutation: NEW_TRACE_STATE,
                variables: {
                    key: "test",
                },
            })
        ).toMatchObject({
            data: {
                newTraceState: {
                    key: "test",
                },
            },
            errors: undefined,
        });
    });

    it("should find trace state object", async () => {
        expect(
            await client.mutate({
                mutation: FIND_TRACE_STATE,
                variables: {
                    key: "test",
                },
            })
        ).toMatchObject({
            data: {
                traceState: {
                    key: "test",
                },
            },
            errors: undefined,
        });
    });

    it("should create new trace object", async () => {
        expect(
            await client.mutate({
                mutation: NEW_TRACE_STATE,
                variables: {
                    key: "test_key",
                },
            })
        ).toMatchObject({ data: { newTraceState: { key: "test_key" } } });

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

    it("should fail to create trace state object", async () => {
        expect(
            await client.mutate({
                mutation: NEW_TRACE_STATE,
                variables: {
                    key: "test_key2",
                },
            })
        ).toMatchObject({
            data: { newTraceState: { key: "test_key2" } },
            errors: undefined,
        });

        expect(
            await client.mutate({
                mutation: NEW_TRACE_STATE,
                variables: {
                    key: "test_key2",
                },
            })
        ).toMatchObject({
            data: null,
            errors: [{}],
        });
    });

    it("test secondary objects created", async () => {
        const traceState = await manager.save(
            manager.create(TraceState, {
                key: "test-key",
            })
        );

        let probe = await manager.save(
            manager.create(Probe, {
                traceStateId: traceState.id,
                lastHeartbeat: new Date(),
            })
        );

        const probeRepository = manager.getCustomRepository(ProbeRepository);
        expect(
            await probeRepository.findActiveProbesIds(traceState.id)
        ).toMatchObject([{}]);

        expect(
            await client.mutate({
                mutation: NEW_TRACE,
                variables: {
                    module: "mod",
                    function: "func",
                    statement: "statement",
                    key: traceState.key,
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
            await probeRepository.findActiveProbesIds(traceState.id)
        ).toMatchObject([{}]);

        const traceLog = await manager.findOne(TraceLog, {
            relations: ["traceLogStatuses"],
            where: {
                traceStateId: traceState.id,
            },
            order: {
                updatedAt: "DESC",
            },
        });

        expect(traceLog).toMatchObject({
            traceLogStatuses: [{ probeId: 1, type: 0 }],
        });

        probe = await manager.findOne(Probe, {
            where: {
                id: probe.id,
            },
            relations: ["traceLogStatuses"],
        });

        expect(probe).toMatchObject({
            id: 1,
            traceLogStatuses: [{}],
        });
    });
});
