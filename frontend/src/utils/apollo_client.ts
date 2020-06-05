import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { WebSocketLink } from "@apollo/link-ws";
import { SubscriptionClient } from "subscriptions-transport-ws";
import fetch from "isomorphic-unfetch";
import { getPublicRuntimeConfig, getServerRuntimeConfig } from "../config";
import { isSecure } from "./protocol";

export function createApolloClient(token) {
    const secure = isSecure();
    const ssrMode = !process.browser;
    // The `ctx` (NextPageContext) will only be present on the server.
    // use it to extract auth headers (ctx.req) or similar.

    let link;
    if (ssrMode) {
        link = new HttpLink({
            uri: `http${secure ? "s" : ""}://${
                getServerRuntimeConfig().endpoint
            }/api/graphql`, // Server URL (must be absolute)
            credentials: "same-origin", // Additional fetch() options like `credentials` or `headers`
            headers: {
                "X-Token": token,
            },
            fetch,
        });
    } else {
        const client = new SubscriptionClient(
            `ws${secure ? "s" : ""}://${
                getPublicRuntimeConfig().endpoint
            }/api/graphql`,
            {
                reconnect: true,
                connectionParams: {
                    token,
                },
            }
        );
        link = new WebSocketLink(client);
    }

    return new ApolloClient({
        ssrMode,
        link,
        cache: new InMemoryCache(),
    });
}
