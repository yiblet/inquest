import { createSQLiteServer } from "./../../connect";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
import { EntityManager, getManager } from "typeorm";
import { TraceState } from "../../entities";
import {
    createTestClient,
    ApolloServerTestClient,
} from "apollo-server-testing";
import gql from "graphql-tag";

export const NEW_TRACE_STATE = gql`
    mutation newTraceState($key: String!) {
        newTraceState(traceStateKey: $key) {
            key
        }
    }
`;

const FIND_PROBE = gql`
    query probeQuery($key: String!) {
        probe(key: $key) {
            key
        }
    }
`;

const NEW_PROBE = gql`
    mutation newProbeMutation($key: String!) {
        newProbe(traceStateKey: $key) {
            key
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
        manager = getManager();
        client = createTestClient(server);
    });

    afterAll(async () => {
        await server.stop();
        Container.reset();
    });

    it("should fail to find probe state object", async () => {
        const state = await manager.save(
            manager.create(TraceState, { key: "testing123" })
        );
        expect(
            await client.mutate({
                mutation: FIND_PROBE,
                variables: {
                    key: state.key,
                },
            })
        ).toMatchInlineSnapshot(`
            Object {
              "data": Object {
                "probe": null,
              },
              "errors": undefined,
              "extensions": undefined,
              "http": Object {
                "headers": Headers {
                  Symbol(map): Object {},
                },
              },
            }
        `);

        expect(
            await client.mutate({
                mutation: FIND_PROBE,
                variables: {
                    key: "wrong state key test",
                },
            })
        ).toMatchInlineSnapshot(`
            Object {
              "data": Object {
                "probe": null,
              },
              "errors": undefined,
              "extensions": undefined,
              "http": Object {
                "headers": Headers {
                  Symbol(map): Object {},
                },
              },
            }
        `);
    });

    it("should fail to find probe state object", async () => {
        const state = await manager.save(
            manager.create(TraceState, { key: "testing1234" })
        );

        const mutation = client.mutate({
            mutation: NEW_PROBE,
            variables: {
                key: state.key,
            },
        });
        expect(await mutation).toMatchObject({
            data: {
                newProbe: {
                    key: {},
                },
            },
            errors: undefined,
        });

        const key: string = (await mutation).data.newProbe.key;

        expect(
            await client.mutate({
                mutation: FIND_PROBE,
                variables: {
                    key: key,
                },
            })
        ).toMatchObject({
            data: {
                probe: {
                    key: {},
                },
            },
            errors: undefined,
        });
    });
});
