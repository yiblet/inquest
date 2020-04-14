// needed for typeorm && type-graphl to function
import "reflect-metadata";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
import * as TypeORM from "typeorm";
import * as TypeGraphQL from "type-graphql";
import { ALL_ENTITIES } from "./entities";
import { ALL_RESOLVERS } from "./resolvers";
import { Context } from "./context";
import { seedDatabase } from "./helpers";

export async function connectTypeOrm() {
    // create TypeORM connection
    TypeORM.useContainer(Container);
    return await TypeORM.createConnection({
        type: "sqlite",
        database: ":memory:",
        entities: ALL_ENTITIES,
        synchronize: true,
        logger: "debug",
        cache: true,
    });
}

// register 3rd party IOC container
export async function createSQLiteServerSchema() {
    await connectTypeOrm();
    // seed database with some data
    const { defaultUser } = await seedDatabase();

    // build TypeGraphQL executable schema
    const schema = await TypeGraphQL.buildSchema({
        resolvers: ALL_RESOLVERS,
        container: Container,
    });

    // create mocked context
    const context: Context = { user: defaultUser };

    // Create GraphQL server
    return { schema, context };
}

export async function createSQLiteServer() {
    return new ApolloServer(await createSQLiteServerSchema());
}
