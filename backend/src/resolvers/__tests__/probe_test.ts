import "reflect-metadata";
import { createSQLiteServer } from "./../../connect";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
import { EntityManager, getManager } from "typeorm";
import { TraceSet } from "../../entities";
import {
    createTestClient,
    ApolloServerTestClient,
} from "apollo-server-testing";
import gql from "graphql-tag";

export const NEW_TRACE_STATE = gql`
    mutation newTraceSet($key: String!) {
        newTraceSet(traceSetKey: $key) {
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
        newProbe(traceSetKey: $key) {
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

    it("should fail to find probe set object", async () => {
        const set = await manager.save(
            manager.create(TraceSet, { key: "testing123" })
        );
        expect(
            await client.mutate({
                mutation: FIND_PROBE,
                variables: {
                    key: set.key,
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
                    key: "wrong trace set key test",
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

    it("should fail to find probe trace set object", async () => {
        const set = await manager.save(
            manager.create(TraceSet, { key: "testing1234" })
        );

        const mutation = client.mutate({
            mutation: NEW_PROBE,
            variables: {
                key: set.key,
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
