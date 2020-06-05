import "./env";

// TODO productionize use a more featured configuration management solution
export const config = {
    server: {
        host: "0.0.0.0",
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
            // just checks if the port is 443
            useSSL: parseInt(process.env.MINIO_PORT || "9000") === 443,
            accessKey: process.env.MINIO_ACCESS_KEY || "minio",
            secretKey: process.env.MINIO_SECRET_KEY || "minio123",
        },
        bucket: process.env.MINIO_BUCKET_NAME || "bucket",
        region: "us-east-1",
    },
};
