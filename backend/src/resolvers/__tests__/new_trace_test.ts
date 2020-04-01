import { createSQLiteServer } from "./../../connect";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
import {
    createTestClient,
    ApolloServerTestClient,
} from "apollo-server-testing";
import gql from "graphql-tag";

const NEW_TRACE = gql`
    mutation newTrace($module: String!, $function: String!) {
        newTrace(newTraceInput: { module: $module, function: $function }) {
            module
        }
    }
`;

let server: ApolloServer;
let client: ApolloServerTestClient;
beforeAll(async () => {
    Container.reset();
    server = await createSQLiteServer();
    client = createTestClient(server);
});

afterAll(() => {
    server.stop();
    Container.reset();
});

it("should create new trace object", async () => {
    expect(
        await client.mutate({
            mutation: NEW_TRACE,
            variables: {
                module: "mod",
                function: "func",
            },
        })
    ).toMatchSnapshot();
});
