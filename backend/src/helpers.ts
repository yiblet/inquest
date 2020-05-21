import { getRepository, getManager, Column, ColumnOptions } from "typeorm";

import { User, TraceSet } from "./entities";
import { hash } from "bcrypt";
import { Organization } from "./entities/organization";
import { logger } from "./logging";

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
            organizationId: defaultOrganization.id,
        })
    );

    logger.info("database seeded", {
        user: defaultUser.email,
        traceSet: defaultTraceSet.id,
    });

    return {
        defaultUser,
    };
}

export function RelationColumn(options?: ColumnOptions) {
    return Column({ nullable: true, ...options });
}
