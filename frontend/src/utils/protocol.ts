import { getPublicRuntimeConfig } from "../config";

/**
 * whether or not the browser is connected through HTTPS
 */
export const isSecure = () => {
    return (
        (process.browser &&
            window &&
            window.location.toString().startsWith("https")) ||
        false
    );
};

/**
 * whether or not the frontend being self-hosting
 * NOTE: this is not secure it's obviously spoofable
 *       this is just used to change up the view and information
 *       displayed a little bit to be relevant to the user
 */
export const isSelfHosted = () => {
    const { endpoint } = getPublicRuntimeConfig();
    return endpoint !== "inquest.dev";
};

/**
 * get's the location of the documentation site
 * evaluates to https://docs.inquet.dev/docs/overview in production
 */
export function getDocsURL() {
    const secure = isSecure();
    const { docsEndpoint } = getPublicRuntimeConfig();
    return `http${secure ? "s" : ""}://${docsEndpoint}`;
}

/**
 * get's the location of the get started docs page
 */
export function getGetStartedDocsURL() {
    const route = isSelfHosted()
        ? "/docs/getting_started_with_docker"
        : "/docs";
    return getDocsURL() + route;
}
