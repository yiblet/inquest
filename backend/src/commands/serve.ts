import "../prelude";
import { config } from "../config";
import { createApp } from "../app";
import { ProdConnector } from "../connect";

async function bootstrap() {
    const app = await createApp(new ProdConnector());
    app.listen({ port: config.server.port }, () => {
        console.log(
            `Server ready at http://${config.server.host}:${config.server.port}`
        );
    });
}
bootstrap();
