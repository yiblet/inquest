import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { WebSocketLink } from "@apollo/link-ws";
import { SubscriptionClient } from "subscriptions-transport-ws";
import fetch from "isomorphic-unfetch";
import { getPublicRuntimeConfig } from "../config";

export function createApolloClient() {
    const ssrMode = !process.browser;
    // The `ctx` (NextPageContext) will only be present on the server.
    // use it to extract auth headers (ctx.req) or similar.

    let link;
    if (ssrMode) {
        link = new HttpLink({
            uri: `http://${getPublicRuntimeConfig().endpoint}/graphql`, // Server URL (must be absolute)
            credentials: "same-origin", // Additional fetch() options like `credentials` or `headers`
            fetch,
        });
    } else {
        const client = new SubscriptionClient(
            `ws://${getPublicRuntimeConfig().endpoint}/graphql`,
            {
                reconnect: true,
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
