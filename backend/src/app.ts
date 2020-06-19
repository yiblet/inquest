// needed for typeorm && type-graphl to function
import "reflect-metadata";
// imports the .env file
import "./env";
import { config } from "./config";
import { Connector } from "./connect";
import express, {
    Request as ExpRequest,
    Response,
    NextFunction,
} from "express";
import { ApolloServer } from "apollo-server-express";
import { Container } from "typedi";
import {
    AuthService,
    LoginInfo,
    SignupInfo,
    getUserAuthToken,
} from "./services/auth";
import { UploadService } from "./services/upload";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import { PublicError, createTransaction, Serial } from "./utils";
import { createServer } from "http";
import { logger } from "./logging";
import Busboy from "busboy";
import { streamToBuffer } from "./services/storage";
import { Logger } from "winston";
import { FileInfo } from "./entities";
import { getManager } from "typeorm";
import { FileInfoRepository } from "./repositories/file_info_repository";

interface Request extends ExpRequest {
    logger?: Logger;
}

function getErrorPayload(err: any) {
    if (err instanceof Error)
        return {
            error: err.message ?? "",
            stack: err.stack,
        };
    else {
        return {
            error: JSON.stringify(err),
        };
    }
}

/**
 * wraps async handlers around a try catch to verify that the handler sends the request
 */
function wrapAsync(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.logger?.info("received request");
            await handler(req, res, next);
            if (!res.headersSent) {
                throw new Error("failed to send headers");
            }
        } catch (err) {
            req.logger?.error(
                "exception in request resolution",
                getErrorPayload(err)
            );

            if (err instanceof PublicError) {
                res.status(400).send({
                    message: err.message,
                });
            } else {
                res.status(500).send({
                    message: "an internal error occurred",
                });
            }
        } finally {
            req.logger?.info("completed request");
        }
    };
}

class FileUploadException extends Error {
    constructor(public name: string, public error: Error) {
        super();
    }
}

// register 3rd party IOC container
export async function createApp(connector: Connector) {
    // gets the graphql server schema
    const schema = await connector.buildSchema();
    const authService = Container.get(AuthService);
    const app = express();

    // sets up cors
    app.use(
        cors({
            origin: [
                `http://${config.server.host}:${config.server.port}`,
                `http://${config.frontend.host}:${config.frontend.port}`,
                /yiblet\.com$/,
            ],
            credentials: true,
        })
    );
    app.use(
        bodyParser.urlencoded({
            extended: true,
        })
    );
    app.use(
        session({
            name: config.session.name,
            secret: config.session.secret,
            resave: false,
            saveUninitialized: false,
        })
    );

    // simplistic logging middlware
    app.use((req: Request, res, next) => {
        const childLogger = logger.child({
            url: req.url,
        });
        req.logger = childLogger;
        next();
    });

    app.get("/", (req, res) => {
        res.status(200).send("hello world");
    });

    app.get("/api/version", (req, res) => {
        res.status(200).send(config.version);
    });

    app.post(
        "/api/signup",
        wrapAsync(async (req, res) => {
            const signup = new SignupInfo();
            signup.email = req?.body?.email;
            signup.password = req?.body?.password;
            signup.password2 = req?.body?.password2;
            signup.firstname = req?.body?.firstname;
            signup.lastname = req?.body?.lastname;
            const user = await authService.signup(signup);
            const token = await authService.genToken(user);
            res.status(200).send({
                token: token,
            });
        })
    );

    app.post(
        "/api/login",
        wrapAsync(async (req, res) => {
            const login = new LoginInfo();
            login.email = req?.body?.email;
            login.password = req?.body?.password;
            const user = await authService.login(login);
            const token = await authService.genToken(user);
            res.status(200).send({
                token: token,
            });
        })
    );

    app.post(
        "/api/refresh",
        wrapAsync(async (req, res) => {
            const token = getUserAuthToken(req);
            const user = await authService.verify(token);
            const newToken = await authService.genToken(user);
            res.status(200).send({
                token: newToken,
            });
        })
    );

    /*
     * input format:
     * urlencoded body is a series of filenames and their corrresponding md5hash
     */
    app.post(
        "/api/upload/:traceSetId/check",
        wrapAsync(async (req, res) => {
            const fileInfoRepository = getManager().getCustomRepository(
                FileInfoRepository
            );
            const traceSetId: string | undefined = req.params.traceSetId;
            if (!traceSetId) {
                throw new PublicError("must pass in traceSetId");
            }
            if (typeof req.body !== "object") {
                throw new PublicError("invalid body");
            }

            const differences = await fileInfoRepository.findDifferences(
                traceSetId,
                req.body
            );
            res.status(200).send(differences);
        })
    );

    /*
     * input format:
     * multipart form of multiple files (fieldname must be relative filename)
     * returns object mapping file name to fileId
     */
    app.post(
        "/api/upload/:traceSetId/send",
        wrapAsync(async (req, res) => {
            const uploadService = Container.get(UploadService);
            const manager = getManager();
            const traceSetId: string | undefined = req.params.traceSetId;
            if (!traceSetId) {
                throw new PublicError("must pass in traceSetId");
            }
            return createTransaction(manager, () => {
                const busboy = new Busboy({
                    headers: req.headers,
                    preservePath: true,
                    limits: { files: 32 },
                });
                const buffers: [string, Promise<Buffer>][] = [];

                return new Promise<void>((resolve, reject) => {
                    busboy.on("file", (fieldname, fileStream) => {
                        // warning this lambda is processed in parallel
                        const filename = decodeURIComponent(fieldname);
                        buffers.push([filename, streamToBuffer(fileStream)]);
                    });

                    // TODO refactor & move this lambda to it's own top level function
                    busboy.on("finish", async () => {
                        try {
                            const successes = new Map<string, FileInfo>();
                            const errors = new Map<string, Error>();
                            for (const [filename, buffer] of buffers) {
                                try {
                                    successes.set(
                                        filename,
                                        await uploadService.upload(
                                            manager,
                                            filename,
                                            decodeURIComponent(traceSetId),
                                            await buffer
                                        )
                                    );
                                } catch (err) {
                                    errors.set(filename, err);
                                    req.logger?.error(
                                        "exception in receiving files",
                                        {
                                            file: filename,
                                            ...getErrorPayload(err),
                                        }
                                    );
                                }
                            }

                            if (errors.size === 0) {
                                const data = {};
                                // no failure happened
                                for (const file of successes.values()) {
                                    data[file.name] = file.id;
                                }
                                res.status(200).send(data);
                            } else {
                                // failure occurred
                                const data = {};
                                for (const [filename, err] of errors) {
                                    data[filename] = err;
                                }
                                res.status(500).send(data);
                            }
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                    req.pipe(busboy);
                });
            });
        })
    );

    app.get("/api/logout", (req, res) => {
        res.redirect("/");
    });

    const server = new ApolloServer({ ...schema });
    server.applyMiddleware({ app, path: "/api/graphql" });
    const httpServer = createServer(app);
    server.installSubscriptionHandlers(httpServer);
    return httpServer;
}
