import getConfig from "next/config";

export type PublicRuntimeConfig = {
    endpoint: string;
};

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
    return getConfig().publicRuntimeConfig;
}
