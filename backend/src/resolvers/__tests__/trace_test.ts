import { createSQLiteServer } from "./../../connect";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
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

const NEW_TRACE_STATE = gql`
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
    beforeAll(async () => {
        Container.reset();
        server = await createSQLiteServer();
        client = createTestClient(server);
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
});
