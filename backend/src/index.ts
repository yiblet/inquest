// needed for typeorm && type-graphl to function
import "reflect-metadata";
// imports the .env file
import "./env";
import { config } from "./config";
import { createApp } from "./app";

async function bootstrap() {
    const app = await createApp();
    app.listen({ port: config.server.port }, () => {
        console.log("Server ready at http://localhost:4000");
    });
}
bootstrap();
