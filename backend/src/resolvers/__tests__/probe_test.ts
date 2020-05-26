import "reflect-metadata";
import { DebugConnector } from "./../../connect";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
import { EntityManager, getManager } from "typeorm";
import { TraceSet, Organization } from "../../entities";
import gql from "graphql-tag";
import {
    createWrappedTestClient,
    TestClientWrapper,
} from "../../utils/testing";

import {
    NewProbeMutation,
    NewProbeMutationVariables,
} from "../../generated/NewProbeMutation";

const FIND_PROBE = gql`
    query ProbeQuery($id: String!) {
        probe(probeId: $id) {
            id
        }
    }
`;

const NEW_PROBE = gql`
    mutation NewProbeMutation($id: String!) {
        newProbe(traceSetId: $id) {
            id
        }
    }
`;

describe("testing server", () => {
    let server: ApolloServer;
    let client: TestClientWrapper;
    let manager: EntityManager;
    let org: Organization;
    beforeAll(async () => {
        Container.reset();
        server = await new DebugConnector().buildServer();
        manager = getManager();
        client = createWrappedTestClient(server);
        org = await manager.save(Organization.create({ name: "test" }));
    });

    afterAll(async () => {
        await server.stop();
        Container.reset();
    });

    it("should fail to find probe set object", async () => {
        const set = await manager.save(
            TraceSet.create({
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
                organizationId: org.id,
            })
        );

        const mutation = client.mutate<
            NewProbeMutation,
            NewProbeMutationVariables
        >({
            mutation: NEW_PROBE,
            variables: {
                id: set.id,
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
            await client.mutate<NewProbeMutation, NewProbeMutationVariables>({
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
