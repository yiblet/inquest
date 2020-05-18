import { getRepository, getManager, Column, ColumnOptions } from "typeorm";

import { User, TraceSet } from "./entities";
import { hash } from "bcrypt";
import { Organization } from "./entities/organization";

export async function seedDatabase() {
    const manager = getManager();
    const userRepository = getRepository(User);
    const orgRepository = getRepository(Organization);

    const defaultOrganization = await orgRepository.save(
        Organization.create({ name: "test" })
    );

    const defaultUser = User.create({
        email: "default@example.com",
        firstname: "Default",
        lastname: "User",
        password: await hash("s#cr3tp4ssw0rd", 10),
        organizationId: defaultOrganization.id,
    });

    await userRepository.save(defaultUser);

    const defaultTraceSet = await manager.save(
        TraceSet.create({
            key: "default",
            organizationId: defaultOrganization.id,
        })
    );

    console.log("default user:", defaultUser.email);
    console.log("default traceSet:", defaultTraceSet.key);

    return {
        defaultUser,
    };
}

export function RelationColumn(options?: ColumnOptions) {
    return Column({ nullable: true, ...options });
}
