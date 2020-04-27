import "../prelude";
import { config } from "../config";
import { createApp } from "../app";

async function bootstrap() {
    const app = await createApp();
    app.listen({ port: config.server.port }, () => {
        console.log(
            `Server ready at http://${config.server.host}:${config.server.port}`
        );
    });
}
bootstrap();
