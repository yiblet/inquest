// needed for typeorm && type-graphl to function
import "reflect-metadata";
// imports the .env file
import "./lib/env.ts";
import { createSQLiteServer } from "./connect";

// register 3rd party IOC container
async function bootstrap() {
    try {
        const server = await createSQLiteServer();
        // Start the server
        const { url } = await server.listen(process.env.PORT || 4000);
        console.log(
            `Server is running, GraphQL Playground available at ${url}`
        );
    } catch (err) {
        console.error(err);
    }
}

bootstrap();
