import { createSQLiteServer } from "./../../connect";
import {
    createTestClient,
    ApolloServerTestClient,
} from "apollo-server-testing";

const gql = require("graphql-tag");

const NEW_TRACE: string = gql`
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

    test("test new trace subscription", async () => {
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