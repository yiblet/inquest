import { GraphQLFormattedError, DocumentNode } from "graphql";
import {
    ApolloServerTestClient,
    createTestClient,
} from "apollo-server-testing";
import { ApolloServer } from "apollo-server";

export type GQLResponse<D> = {
    data?: D;
    errors?: ReadonlyArray<GraphQLFormattedError>;
};

declare type Query<VariableType = undefined> = {
    query: DocumentNode | string;
    variables: VariableType;
    operationName?: string;
};
declare type Mutation<VariableType = undefined> = {
    mutation: DocumentNode | string;
    variables: VariableType;
    operationName?: string;
};

export class TestClientWrapper {
    constructor(private client: ApolloServerTestClient) {}

    async query<R, V = undefined>(query: Query<V>): Promise<GQLResponse<R>> {
        return (await this.client.query(query)) as GQLResponse<R>;
    }

    async mutate<R, V = undefined>(
        mutation: Mutation<V>
    ): Promise<GQLResponse<R>> {
        return (await this.client.mutate(mutation)) as GQLResponse<R>;
    }
}

export function createWrappedTestClient(
    server: ApolloServer
): TestClientWrapper {
    return new TestClientWrapper(createTestClient(server));
}
