// needed for typeorm && type-graphl to function
import "reflect-metadata";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
import * as TypeORM from "typeorm";
import * as TypeGraphQL from "type-graphql";
import { ALL_ENTITIES, Probe } from "./entities";
import { ALL_RESOLVERS } from "./resolvers";
import { Context } from "./context";
import { seedDatabase } from "./helpers";
import * as WebSocket from "ws";
import { ConnectionContext } from "subscriptions-transport-ws";
import { getProbeAuth } from "./services/auth";
import { getManager, EntityManager } from "typeorm";
import { PublicError } from "./utils";

/**
 * build TypeGraphQL executable schema
 */
export async function buildSchema(
    options: Partial<TypeGraphQL.BuildSchemaOptions> = {}
) {
    return await TypeGraphQL.buildSchema({
        resolvers: ALL_RESOLVERS,
        container: Container,
    });
}

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

async function authorizeProbe(
    manager: EntityManager,
    context: ConnectionContext
): Promise<Probe | undefined> {
    const authorization = context.request.headers.authorization;
    if (!authorization) return undefined;
    const id = getProbeAuth(authorization);
    const probe = await manager.findOne(Probe, { id });
    if (!probe) throw new PublicError("unauthorized");
    return probe;
}

// register 3rd party IOC container
export async function createSQLiteServerSchema() {
    await connectTypeOrm();
    // seed database with some data
    const { defaultUser } = await seedDatabase();
    const manager = getManager();

    // create mocked context
    const context = async ({ req, res, connection }): Promise<Context> => {
        if (connection) return connection.context;
        return new Context(defaultUser);
    };

    // Create GraphQL server
    return {
        schema: await buildSchema(),
        context,
        subscriptions: {
            path: "/graphql",
            onConnect: async (
                connectionParams,
                websocket: WebSocket,
                context: ConnectionContext
            ): Promise<Context> => {
                const probe = await authorizeProbe(manager, context);
                return new Context(undefined, probe);
            },
            onDisconnect: async (
                websocket: WebSocket,
                context: ConnectionContext
            ) => {
                const probe = await authorizeProbe(manager, context);
                if (probe) {
                    probe.closed = true;
                    await manager.save(probe);
                }
            },
        },
    };
}

export async function createSQLiteServer() {
    return new ApolloServer(await createSQLiteServerSchema());
}
