import { Service } from "typedi";
import { Client } from "minio";
import { config } from "./../config";
import { Stream } from "stream";
import { logger } from "../logging";
import { Logger } from "winston";

/**
 * converts strams to buffers
 */
export const streamToBuffer = (stream: Stream) => {
    const chunks: Uint8Array[] = [];
    return new Promise<Buffer>((resolve, reject) => {
        stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
        stream.on("error", (_) => reject(new Error("stream parse error")));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
};

/**
 * converts the stream to a string
 */
export const streamToString = async (stream: Stream) => {
    return (await streamToBuffer(stream)).toString("utf-8");
};

@Service()
export class StorageService {
    private client: Client;
    private started: boolean;
    private logger: Logger;

    async start() {
        if (!this.started) {
            this.started = true;
        }
        if (!(await this.client.bucketExists(config.storage.bucket))) {
            await this.client.makeBucket(
                config.storage.bucket,
                config.storage.region
            );
        }
    }

    async load(name: string) {
        await this.start();
        return await this.client.getObject(config.storage.bucket, name);
    }

    async save(name: string, data: Buffer) {
        await this.start();
        return await this.client.putObject(config.storage.bucket, name, data);
    }

    async remove(name: string) {
        await this.start();
        return await this.client.removeObject(config.storage.bucket, name);
    }

    constructor() {
        this.client = new Client({
            ...config.storage.client,
        });
        this.started = false;
        this.logger = logger.child({ service: "storage" });
    }
}
