export interface Logger {
    debug(message: string, tags?: string[]);
    info(message: string, tags?: string[]);
    warn(message: string, tags?: string[]);
    error(message: string, tags?: string[]);
}

function convertMessage(message: string, tags: string[]) {
    return `${tags.map((tag) => `[${tag}]`).join("")} ${message}`;
}

export class MainLogger implements Logger {
    sendMessage(message: string, logger: (string) => any) {
        logger(message);
    }
    debug(message: string, tags: string[] = []) {
        this.sendMessage(
            convertMessage(message, ["DEBUG"].concat(tags)),
            console.debug
        );
    }
    info(message: string, tags: string[] = []) {
        this.sendMessage(
            convertMessage(message, ["INFO"].concat(tags)),
            console.info
        );
    }
    warn(message: string, tags: string[] = []) {
        this.sendMessage(
            convertMessage(message, ["WARNING"].concat(tags)),
            console.warn
        );
    }
    error(message: string, tags: string[] = []) {
        this.sendMessage(
            convertMessage(message, ["ERROR"].concat(tags)),
            console.error
        );
    }
}

export class TagLogger implements Logger {
    constructor(private base: Logger, private tags: string[]) {}
    debug(message: string, tags: string[] = []) {
        this.base.debug(message, this.tags.concat(tags));
    }
    info(message: string, tags: string[] = []) {
        this.base.info(message, this.tags.concat(tags));
    }
    warn(message: string, tags: string[] = []) {
        this.base.warn(message, this.tags.concat(tags));
    }
    error(message: string, tags: string[] = []) {
        this.base.error(message, this.tags.concat(tags));
    }
}

const logger = new MainLogger();

export function createLogger(
    tags: string[],
    loggerInstance: Logger = logger
): Logger {
    return new TagLogger(logger, tags);
}
