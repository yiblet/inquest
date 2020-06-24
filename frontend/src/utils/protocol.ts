import { getPublicRuntimeConfig } from "../config";

export const isSecure = () => {
    return (
        (process.browser &&
            window &&
            window.location.toString().startsWith("https")) ||
        false
    );
};

export function getDocsURL() {
    const secure = isSecure();
    const { docsEndpoint } = getPublicRuntimeConfig();
    return `http${secure ? "s" : ""}://${docsEndpoint}/docs/overview`;
}
