export type PublicRuntimeConfig = {
    endpoint: string;
};

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
    return {
        endpoint:
            process.env.NEXT_PUBLIC_ENDPOINT ||
            `${process.env.BACKEND_HOST || "localhost"}:${
                process.env.BACKEND_PORT || 4000
            }`,
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
