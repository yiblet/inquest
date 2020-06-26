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
 * get's the location of the documentation site
 * evaluates to https://docs.inquet.dev/docs/overview in production
 */
export function getDocsURL() {
    const secure = isSecure();
    const { docsEndpoint } = getPublicRuntimeConfig();
    return `http${secure ? "s" : ""}://${docsEndpoint}`;
}
