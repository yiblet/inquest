// needed for typeorm && type-graphl to function
import "reflect-metadata";
// imports the .env file
import "./lib/env";
import { config } from "./config";
import { createSQLiteServerSchema } from "./connect";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { Container } from "typedi";
import {
    AuthService,
    LoginInfo,
    SignupInfo,
    getAuthToken,
} from "./services/auth";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";

// register 3rd party IOC container
export async function createApp() {
    // gets the graphql server schema
    const schema = await createSQLiteServerSchema();
    const authService = Container.get(AuthService);
    const app = express();

    // sets up cors
    app.use(
        cors({
            origin: [
                "http://localhost:4000",
                "http://localhost:3000",
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

    app.get("/cors-test", (req, res) => {
        res.status(200).send("this should return a OK 200 if cors works");
    });

    app.post("/signup", async (req, res) => {
        try {
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
        } catch (e) {
            if (e instanceof Error) {
                res.status(400).send({
                    message: e.message,
                });
            } else {
                res.status(500).send({
                    message: "an internal error occurred",
                });
            }
        }
    });

    app.post("/login", async (req, res) => {
        try {
            const login = new LoginInfo();
            login.email = req?.body?.email;
            login.password = req?.body?.password;
            const user = await authService.login(login);
            const token = await authService.genToken(user);
            res.status(200).send({
                token: token,
            });
        } catch (e) {
            if (e instanceof Error) {
                res.status(400).send({
                    message: e.message,
                });
            } else {
                res.status(500).send({
                    message: "an internal error occurred",
                });
            }
        }
    });

    app.post("/refresh", async (req, res) => {
        try {
            const token = getAuthToken(req);
            const user = await authService.verify(token);
            const newToken = await authService.genToken(user);
            res.status(200).send({
                token: newToken,
            });
        } catch (e) {
            if (e instanceof Error) {
                res.status(400).send({
                    message: e.message,
                });
            } else {
                res.status(500).send({
                    message: "an internal error occurred",
                });
            }
        }
    });

    app.get("/logout", (req, res) => {
        res.redirect("/");
    });

    const server = new ApolloServer({ ...schema });
    server.applyMiddleware({ app, path: "/graphql" });
    return app;
}
