module.exports = {
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "postgres",
    synchronize: process.env.BACKEND_SYNCHRONIZE != undefined,
    logger: "debug",
    cache: true,
    entities: [__dirname + "/build/entities/**/*.js"],
    migrations: [__dirname + "/build/migration/**/*.js"],
    cli: {
        migrationsDir: "src/migrations",
    },
};
