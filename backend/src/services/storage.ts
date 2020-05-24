import { Service } from "typedi";
import { Client } from "minio";
import { config } from "./../config";
import { Stream } from "stream";
import { logger } from "../logging";
import { Logger } from "winston";

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

    // https://stackoverflow.com/questions/10623798/how-do-i-read-the-contents-of-a-node-js-stream-into-a-string-variable
    // TODO test this function
    static streamToString(stream: Stream): Promise<string> {
        const chunks: Uint8Array[] = [];
        return new Promise((resolve, reject) => {
            stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
            stream.on("error", (_) => reject(new Error("stream parse error")));
            stream.on("end", () =>
                resolve(Buffer.concat(chunks).toString("utf8"))
            );
        });
    }

    async save(name: string, data: Buffer) {
        await this.start();
        logger.debug("file saved", { id: name });
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
