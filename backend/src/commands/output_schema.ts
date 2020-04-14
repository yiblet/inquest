import "../prelude";
import { buildSchema } from "../connect";
import { printSchema } from "graphql";

async function generateSchema() {
    console.log(printSchema(await buildSchema({})));
}

generateSchema();
