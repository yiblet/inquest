import { Service } from "typedi";
import { Client } from "minio";
import { config } from "./../config";
import { Stream } from "stream";

@Service()
export class StorageService {
    private client: Client;
    private started: boolean;

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

    async save(name: string, data: Stream | Buffer | string) {
        await this.start();
        return await this.client.putObject(config.storage.bucket, name, data);
    }

    constructor() {
        this.client = new Client({
            ...config.storage.client,
        });
        this.started = false;
    }
}
