import "./env";

// TODO productionize use a more featured configuration management solution
export const config = {
    server: { port: parseInt(process.env.BACKEND_PORT || "4000") },
    auth: {
        secret: process.env.AUTH_SECRET || "auth_secret",
    },
    session: {
        secret:
            process.env.BACKEND_SESSION_SECRET ||
            "beeN2AsaGeib4taiJahkoo2bShah9ah",
        name: "session_store",
        // maxAge is in millisecond we set it to 3 days
        maxAge: 1000 * 60 * 60 * 24 * 3,
    },
    storage: {
        client: {
            endPoint: "127.0.0.1",
            port: 9000,
            useSSL: false,
            accessKey: "minio",
            secretKey: "minio123",
        },
        bucket: "bucket",
        region: "us-east-1",
    },
};
