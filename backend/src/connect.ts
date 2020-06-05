// neededconnectSQLiteTypeOrm& type-graphl to function
import "reflect-metadata";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
import * as TypeORM from "typeorm";
import * as TypeGraphQL from "type-graphql";
import { ALL_ENTITIES, Probe } from "./entities";
import { ALL_RESOLVERS } from "./resolvers";
import { Context } from "./context";
import * as WebSocket from "ws";
import { ConnectionContext, ExecutionParams } from "subscriptions-transport-ws";
import { getProbeAuth, AuthService } from "./services/auth";
import { getManager, EntityManager } from "typeorm";
import { PublicError } from "./utils";
import { ErrorInterceptor, LoggingInterceptor } from "./middlewares";
import { logger } from "./logging";
import * as express from "express";

/**
 * build connectSQLiteTypeOrmecutable schema
 */
export async function buildSchema(
    options: Partial<TypeGraphQL.BuildSchemaOptions> = {}
) {
    return await TypeGraphQL.buildSchema({
        resolvers: ALL_RESOLVERS,
        globalMiddlewares: [LoggingInterceptor, ErrorInterceptor],
        container: Container,
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

async function genContextFromToken(token: string) {
    const authService = Container.get(AuthService);
    const user = await authService.verify(token);
    return new Context(logger.child({ user: user.id }), user, null);
}

export abstract class Connector {
    private connected = false;

    abstract async connect();

    /**
     * buildSchema generates the valid server schema
     */
    async buildSchema() {
        if (!this.connected) {
            await this.connect();
            this.connected = true;
        }
        // seed database with some data
        const manager = getManager();

        // create mocked context
        const context = async ({
            req,
            res,
            connection,
        }: {
            req?: express.Request;
            res?: express.Response;
            connection?: ExecutionParams<Context>;
        }): Promise<Context> => {
            if (connection) return connection.context;
            let context: Context;
            if (req) {
                const token = req.headers["X-Token"];
                if (token && typeof token === "string") {
                    context = await genContextFromToken(token);
                }
            }
            context = new Context(logger.child({ probe: "new" }), null, "new");
            context.logger.info("new http connection");
            return context;
        };

        // Create GraphQL server
        return {
            schema: await buildSchema(),
            context,
            subscriptions: {
                path: "/api/graphql",
                onConnect: async (
                    { token },
                    websocket: WebSocket,
                    context: ConnectionContext
                ): Promise<Context> => {
                    if (token && typeof token === "string") {
                        return await genContextFromToken(token);
                    }

                    const probe = await authorizeProbe(manager, context);
                    return new Context(
                        logger.child({ probe: probe?.id || "new" }),
                        null,
                        probe || "new"
                    );
                },
                onDisconnect: async (
                    websocket: WebSocket,
                    context: ConnectionContext
                ) => {
                    await authorizeProbe(manager, context).then(
                        async (probe) => {
                            if (probe) {
                                probe.closed = true;
                                await manager.save(probe);
                            }
                        }
                    );
                },
            },
        };
    }

    async buildServer() {
        return new ApolloServer(await this.buildSchema());
    }
}

export class ProdConnector extends Connector {
    async connect() {
        TypeORM.useContainer(Container);
        return await TypeORM.createConnection();
    }
}

export class DebugConnector extends Connector {
    async connect() {
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
}
