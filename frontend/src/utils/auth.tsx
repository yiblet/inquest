import { useState } from "react";
import { NextPageContext } from "next";
import { useEffect } from "react";
import Router, { useRouter } from "next/router";
import { Cookie } from "next-cookie";
import cookie from "js-cookie";
import { useNotifications } from "../components/utils/notifications";

/**
 * logs the user in
 */
export const login = (token: string) => {
    cookie.set("token", token, { expires: 3 });
    Router.replace("/dashboard");
};

/**
 * retrieves the user's JWT token
 */
export const getToken = () => {
    return cookie.get("token");
};

/**
 * returns undefined if loggedIn is not known (on first render)
 */
export const useLoggedInState = (): boolean | undefined => {
    const [loggedIn, setLoggedIn] = useState<boolean | undefined>(undefined);
    useEffect(() => {
        setLoggedIn(getToken() != undefined);
    });
    return loggedIn;
};

/**
 * redirects if the user is not logged in
 */
export const useEnsureLoggedIn = () => {
    const notifications = useNotifications();
    const loggedIn = useLoggedInState();
    const router = useRouter();
    useEffect(() => {
        if (loggedIn === false) {
            notifications.notify("need to log in");
            router.replace("/login");
        }
    }, [loggedIn !== undefined]); // effect is only fired off twice
    // once when loggedIn === undefined (at first render)
    // second when loggedIn is a boolean (after the first render)
};

/**
 * redirects of the user is already logged in
 */
export const useEnsureNotLoggedIn = (redirectLocation: string) => {
    const notifications = useNotifications();
    const loggedIn = useLoggedInState();
    const router = useRouter();
    useEffect(() => {
        if (loggedIn === true) {
            notifications.notify("already logged in");
            router.replace(redirectLocation);
        }
    }, [loggedIn !== undefined]); // effect is only fired off twice
    // once when loggedIn === undefined (at first render)
    // second when loggedIn is a boolean (after the first render)
};

export const auth = (ctx: NextPageContext) => {
    const cookie = new Cookie(ctx);
    const token = cookie.get<string>("token");
    // If there's no token, it means the user is not logged in.
    if (!token) {
        if (!process.browser) {
            ctx.res?.writeHead(302, { Location: "/login" });
            ctx.res?.end();
        } else {
            Router.replace("/login");
        }
    }
    return token;
};

/**
 * logs the user out
 * TODO set up a way to ensure other tabs are also logged out of
 */
export const logout = () => {
    cookie.remove("token");
    if (window) window.localStorage.setItem("logout", `${Date.now()}`);
    Router.replace("/login");
};
