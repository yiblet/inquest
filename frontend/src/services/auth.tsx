import React from "react";
import { NextPageContext, NextComponentType } from "next";
import { useEffect } from "react";
import Router from "next/router";
import { Cookie } from "next-cookie";
import cookie from "js-cookie";

export const login = (token: string) => {
    cookie.set("token", token, { expires: 3 });
    Router.push("/dashboard");
};

export const auth = (ctx: NextPageContext) => {
    const cookie = new Cookie(ctx);
    const token = cookie.get<string>("token");
    // If there's no token, it means the user is not logged in.
    if (!token) {
        if (typeof window === "undefined") {
            ctx.res.writeHead(302, { Location: "/login" });
            ctx.res.end();
        } else {
            Router.push("/login");
        }
    }
    return token;
};

export const logout = () => {
    cookie.remove("token");
    // to support logging out from all windows
    window.localStorage.setItem("logout", `${Date.now()}`);
    Router.push("/login");
};

export function withAuth<P>(
    WrappedComponent: NextComponentType<NextPageContext, {}, P>
) {
    const Wrapper = (props: P) => {
        const syncLogout = (event: { key: string }) => {
            if (event.key === "logout") {
                console.info("logged out from storage!");
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
