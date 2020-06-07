// needed for typeorm && type-graphl to function
import "reflect-metadata";
// imports the .env file
import "./env";
import { config } from "./config";
import { Connector } from "./connect";
import express from "express";
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
import fileUpload, { UploadedFile } from "express-fileupload";
import session from "express-session";
import { PublicError } from "./utils";
import { createServer } from "http";
import { logger } from "./logging";

function wrapAsync(handler: express.Handler) {
    return async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        try {
            await handler(req, res, next);
            if (!res.headersSent) {
                throw new Error("failed to send headers");
            }
        } catch (e) {
            if (e instanceof PublicError) {
                console.info(e);
                res.status(400).send({
                    message: e.message,
                });
            } else {
                console.error(e);
                res.status(500).send({
                    message: "an internal error occurred",
                });
            }
        }
    };
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
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(
        session({
            name: config.session.name,
            secret: config.session.secret,
            resave: false,
            saveUninitialized: false,
        })
    );

    app.use(
        fileUpload({
            // limits to 50M
            limits: { fileSize: 50 * 1024 * 1024 },
        })
    );

    // simplistic logging middlware
    app.use((req, res, next) => {
        logger.info("received request", {
            url: req.url,
        });
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

    app.post(
        /^\/api\/upload\/([A-Za-z0-9-]*)\/(.*)$/,
        wrapAsync(async (req, res) => {
            const uploadService = Container.get(UploadService);
            let file: UploadedFile | undefined = undefined;
            const traceSetId: string | undefined = req.params[0];
            const filename: string | undefined = req.params[1];
            if (!traceSetId) {
                throw new PublicError("must pass in traceSetId");
            }
            if (!filename) {
                throw new PublicError("must pass in file");
            }

            const files: UploadedFile | UploadedFile[] | undefined =
                req.files?.data;
            if (Array.isArray(files)) {
                if (files.length !== 1) {
                    throw new PublicError("must pass in exactly one file");
                }
                file = files[0];
            } else {
                file = files;
            }

            const data = file?.data ?? Buffer.from("");

            const fileResult = await uploadService.upload(
                decodeURIComponent(filename),
                decodeURIComponent(traceSetId),
                data
            );
            res.status(200).send({
                fileId: fileResult.id,
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
