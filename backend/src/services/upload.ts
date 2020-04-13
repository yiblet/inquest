import { EntityManager } from "typeorm";
import { Service, Inject } from "typedi";
import { InjectManager } from "typeorm-typedi-extensions";
import { File } from "../entities";
import { StorageService } from "./storage";
import { v4 as uuidv4 } from "uuid";
import Stream from "stream";

@Service()
export class UploadService {
    @InjectManager()
    private manager: EntityManager;

    @Inject()
    private storageService: StorageService;

    async upload(name: string, blob: Buffer | Stream) {
        const objectName: string = uuidv4();
        await this.storageService.save(objectName, blob);
        const file = this.manager.create(File, {
            name: name,
            objectName: objectName,
        });
        return await this.manager.save(file);
    }
}
