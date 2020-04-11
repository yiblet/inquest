// needed for typeorm && type-graphl to function
import "reflect-metadata";
// imports the .env file
import "./lib/env";
import { createSQLiteServer } from "./connect";
import express from "express";
import { getManager } from "typeorm";
import { User } from "./entities";
import { Container } from "typedi";
import passport from "passport";
import cors from "cors";
import { Strategy as LocalStrategy } from "passport-local";

function configurePassport() {
    passport.use(
        "signup",
        new LocalStrategy(
            {
                usernameField: "email",
                passwordField: "password",
                passReqToCallback: true,
            },
            async (req, email: string, password: string, cb) => {
                if (password != req.body.password2) {
                    return cb("passwords do not match");
                }
                try {
                    let user = await getManager().findOne(User, {
                        email: email,
                    });
                    if (user) return cb("user already exists with that email");

                    user = new User();
                    user.firstname = req.body.firstname;
                    user.lastname = req.body.lastname;
                    user.email = email;
                    user.password = await User.hashPassword(password, false);

                    const validUser = await user.isValid(password);
                    if (validUser.length === 0) {
                        user = await getManager().save(User, user);
                        return cb(null, user);
                    }
                    // TODO send all errors
                    cb(validUser[0]);
                } catch (e) {
                    // TODO through errors when things break
                    cb(e);
                }
            }
        )
    );

    passport.use(
        new LocalStrategy(
            { usernameField: "email", passwordField: "password" },
            async (email: string, password: string, cb) => {
                try {
                    const user = await getManager().findOne(User, {
                        email: email,
                    });
                    if (!user)
                        return cb("password or email could not be found");
                    if (!(await user.isPassword(password)))
                        return cb("password or email could not be found");
                    cb(null, user);
                } catch (e) {
                    cb(e);
                }
            }
        )
    );

    passport.serializeUser((user: User, cb) => {
        cb(null, user.id);
    });

    passport.deserializeUser((id, cb) => {
        getManager()
            .findOne(User, id)
            .then((user) => {
                if (!user) return cb(new Error("failed to find user"));
                cb(null, user);
            });
    });
}

// register 3rd party IOC container
async function bootstrap() {
    try {
        const server = await createSQLiteServer();
        // Start the server
        const info = await server.listen(process.env.PORT || 4000);
        console.log(`Server is running on ${info.url}`);
        console.log(`websockets at ${info.subscriptionsUrl}`);
    } catch (err) {
        console.error(err);
    }
}

bootstrap();
