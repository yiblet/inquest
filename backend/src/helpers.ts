import { getRepository, getManager, Column, ColumnOptions } from "typeorm";

import { User, TraceSet } from "./entities";
import { hash } from "bcrypt";

export async function seedDatabase() {
    const manager = getManager();
    const userRepository = getRepository(User);

    const defaultUser = userRepository.create({
        email: "test@github.com",
        firstname: "Michal",
        lastname: "Lytek",
        nickname: "MichalLytek",
        password: await hash("s#cr3tp4ssw0rd", 10),
    });
    await userRepository.save(defaultUser);

    await manager.save(
        manager.create(TraceSet, {
            key: "default",
        })
    );

    return {
        defaultUser,
    };
}

export function RelationColumn(options?: ColumnOptions) {
    return Column({ nullable: true, ...options });
}
