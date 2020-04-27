import "./env";

// TODO productionize use a more featured configuration management solution
export const config = {
    server: {
        host: process.env.BACKEND_HOST || "localhost",
        port: parseInt(process.env.BACKEND_PORT || "4000"),
    },
    frontend: {
        host: process.env.FRONTEND_HOST || "localhost",
        port: parseInt(process.env.FRONTEND_PORT || "3000"),
    },
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
            endPoint: process.env.MINIO_HOST || "127.0.0.1",
            port: parseInt(process.env.MINIO_PORT || "9000"),
            useSSL: false,
            accessKey: process.env.MINIO_ACCESS_KEY || "minio",
            secretKey: process.env.MINIO_SECRET_KEY || "minio123",
        },
        bucket: "bucket",
        region: "us-east-1",
    },
};
