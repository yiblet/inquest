import React, { useState } from "react";
import { NextPageContext, NextComponentType } from "next";
import { useEffect } from "react";
import Router, { useRouter } from "next/router";
import { Cookie } from "next-cookie";
import cookie from "js-cookie";
import { useNotifications } from "../components/utils/notifications";

export const login = (token: string) => {
    cookie.set("token", token, { expires: 3 });
    Router.replace("/dashboard");
};

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
    }, [loggedIn]);
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
    }, [loggedIn]);
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

export const logout = () => {
    cookie.remove("token");
    if (window) window.localStorage.setItem("logout", `${Date.now()}`);
    Router.replace("/login");
};

export function withAuth<P>(
    WrappedComponent: NextComponentType<NextPageContext, {}, P>
) {
    const Wrapper = (props: P) => {
        const syncLogout = (event: StorageEvent) => {
            if (event.key === "logout") {
                Router.push("/login");
            }
        };

        useEffect(() => {
            window.addEventListener("storage", syncLogout);

            return () => {
                window.removeEventListener("storage", syncLogout);
                window.localStorage.removeItem("logout");
            };
        }, []);

        return <WrappedComponent {...props} />;
    };

    Wrapper.getInitialProps = async (ctx: NextPageContext) => {
        const token = auth(ctx);

        const componentProps =
            WrappedComponent.getInitialProps &&
            (await WrappedComponent.getInitialProps(ctx));

        return { ...componentProps, token };
    };

    return Wrapper;
}
