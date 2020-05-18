import "reflect-metadata";
import { createSQLiteServer } from "./../../connect";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
import { EntityManager, getManager } from "typeorm";
import { TraceSet, Organization } from "../../entities";
import {
    createTestClient,
    ApolloServerTestClient,
} from "apollo-server-testing";
import gql from "graphql-tag";

const FIND_PROBE = gql`
    query probeQuery($id: String!) {
        probe(probeId: $id) {
            id
        }
    }
`;

const NEW_PROBE = gql`
    mutation newProbeMutation($id: String!) {
        newProbe(traceSetKey: $id) {
            id
        }
    }
`;

describe("testing server", () => {
    let server: ApolloServer;
    let client: ApolloServerTestClient;
    let manager: EntityManager;
    let org: Organization;
    beforeAll(async () => {
        Container.reset();
        server = await createSQLiteServer();
        manager = getManager();
        client = createTestClient(server);
        org = await manager.save(Organization.create({ name: "test" }));
    });

    afterAll(async () => {
        await server.stop();
        Container.reset();
    });

    it("should fail to find probe set object", async () => {
        const set = await manager.save(
            TraceSet.create({
                key: "test3",
                organizationId: org.id,
            })
        );
        expect(
            await client.mutate({
                mutation: FIND_PROBE,
                variables: {
                    id: set.id,
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
                    id: "wrong trace set id test",
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
            TraceSet.create({
                key: "test4",
                organizationId: org.id,
            })
        );

        const mutation = client.mutate({
            mutation: NEW_PROBE,
            variables: {
                id: set.key,
            },
        });
        expect(await mutation).toMatchObject({
            data: {
                newProbe: {
                    id: {},
                },
            },
            errors: undefined,
        });

        const id: string | null = (await mutation).data?.newProbe.id ?? null;
        expect(id).toBeTruthy();
        if (!id) throw new Error("id should be truthy");

        expect(
            await client.mutate({
                mutation: FIND_PROBE,
                variables: {
                    id: id,
                },
            })
        ).toMatchObject({
            data: {
                probe: {
                    id: {},
                },
            },
            errors: undefined,
        });
    });
});
