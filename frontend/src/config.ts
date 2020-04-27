export const config = {
    traceSet: "default",
    endpoint: `${process.env.BACKEND_HOST || "localhost"}:${
        process.env.BACKEND_PORT || 4000
    }`,
};
