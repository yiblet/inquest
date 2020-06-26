export type PublicRuntimeConfig = {
    endpoint: string;
    docsEndpoint: string;
};

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
    return {
        endpoint:
            process.env.NEXT_PUBLIC_ENDPOINT ||
            `${process.env.BACKEND_HOST || "localhost"}:${
                process.env.BACKEND_PORT || 4000
            }`,
        docsEndpoint:
            process.env.NEXT_PUBLIC_DOCS_ENDPOINT || "docs.inquest.dev",
    };
}

export type ServerRuntimeConfig = {
    endpoint: string;
};

export function getServerRuntimeConfig(): ServerRuntimeConfig {
    return {
        endpoint: `${process.env.BACKEND_HOST || "localhost"}:${
            process.env.BACKEND_PORT || 4000
        }`,
    };
}
