import "reflect-metadata";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
import * as TypeORM from "typeorm";
import * as TypeGraphQL from "type-graphql";

import { RecipeResolver } from "./resolvers/recipe-resolver";
import { RateResolver } from "./resolvers/rate-resolver";
import { Recipe } from "./entities/recipe";
import { Rate } from "./entities/rate";
import { User } from "./entities/user";
import { seedDatabase } from "./helpers";

export interface Context {
    user: User;
}

// register 3rd party IOC container
TypeORM.useContainer(Container);

async function bootstrap() {
    try {
        // create TypeORM connection
        await TypeORM.createConnection({
            type: "sqlite",
            database: ":memory:",
            entities: [Recipe, Rate, User],
            synchronize: true,
            logger: "debug",
            cache: true,
        });

        // seed database with some data
        const { defaultUser } = await seedDatabase();

        // build TypeGraphQL executable schema
        const schema = await TypeGraphQL.buildSchema({
            resolvers: [RecipeResolver, RateResolver],
            container: Container,
        });

        // create mocked context
        const context: Context = { user: defaultUser };

        // Create GraphQL server
        const server = new ApolloServer({ schema, context });

        // Start the server
        const { url } = await server.listen(process.env.PORT || 4000);
        console.log(
            `Server is running, GraphQL Playground available at ${url}`
        );
    } catch (err) {
        console.error(err);
    }
}

bootstrap();
