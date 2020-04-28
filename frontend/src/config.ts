import getConfig from "next/config";

export type PublicRuntimeConfig = {
    traceSet: string;
    endpoint: string;
};

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
    return getConfig().publicRuntimeConfig;
}
