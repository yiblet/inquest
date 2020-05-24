import winston = require("winston");

function createLogger() {
    switch (process.env.NODE_ENV) {
        case "test":
            return winston.createLogger({
                silent: true,
            });
        case "debug":
            return winston.createLogger({
                level: "debug",
                format: winston.format.prettyPrint(),
                defaultMeta: { instance: "backend" },
                transports: [
                    new winston.transports.Console({
                        format: winston.format.simple(),
                    }),
                ],
            });
        case "production":
        /* follow through */
        /* eslint-disable */
        default:
            /* eslint-enable */
            return winston.createLogger({
                level: "info",
                format: winston.format.prettyPrint(),
                defaultMeta: { instance: "backend" },
                transports: [
                    new winston.transports.Console({
                        format: winston.format.simple(),
                    }),
                ],
            });
    }
}

export const logger = createLogger();
