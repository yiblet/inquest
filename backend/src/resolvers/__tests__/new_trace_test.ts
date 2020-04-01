import { createSQLiteServer } from "./../../connect";
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

describe("queries", () => {
    let client: ApolloServerTestClient;
    beforeAll(async () => {
        const server = await createSQLiteServer();
        client = createTestClient(server);
    });

    test("test new trace mutation", async () => {
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
});
