import { MiddlewareFn } from "type-graphql";
import { PublicError } from "./utils";
import { Context } from "./context";

export const ErrorInterceptor: MiddlewareFn<Context> = async (
    { context, info },
    next
) => {
    try {
        return await next();
    } catch (err) {
        if (err instanceof Error)
            context.logger.error("exception in graphql resolution", {
                field: info.fieldName,
                error: err.message ?? "",
                stack: err.stack,
            });
        else {
            context.logger.error("exception in graphql resolution", {
                field: info.fieldName,
                error: JSON.stringify(err),
            });
        }

        if (err instanceof PublicError) throw err;
        else throw new Error("an internal error has occured");
    }
};
