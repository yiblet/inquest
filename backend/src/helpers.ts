import { getRepository, getManager, Column, ColumnOptions } from "typeorm";

import { Recipe, Rate, User, TraceSet } from "./entities";
import { hash } from "bcrypt";

export async function seedDatabase() {
    const manager = getManager();
    const recipeRepository = getRepository(Recipe);
    const ratingsRepository = getRepository(Rate);
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

    const recipes = recipeRepository.create([
        {
            title: "Recipe 1",
            description: "Desc 1",
            author: defaultUser,
            ratings: ratingsRepository.create([
                { value: 2, user: defaultUser },
                { value: 4, user: defaultUser },
                { value: 5, user: defaultUser },
                { value: 3, user: defaultUser },
                { value: 4, user: defaultUser },
            ]),
        },
        {
            title: "Recipe 2",
            author: defaultUser,
            ratings: ratingsRepository.create([
                { value: 2, user: defaultUser },
                { value: 4, user: defaultUser },
            ]),
        },
    ]);
    await recipeRepository.save(recipes);

    return {
        defaultUser,
    };
}

export function RelationColumn(options?: ColumnOptions) {
    return Column({ nullable: true, ...options });
}
