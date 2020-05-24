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
                operation: info.operation.name?.value || "",
                type: info.operation.operation,
                parent: info.parentType.name,
                field: info.fieldName,
                error: err.message ?? "",
                stack: err.stack,
            });
        else {
            context.logger.error("exception in graphql resolution", {
                operation: info.operation.name?.value || "",
                type: info.operation.operation,
                parent: info.parentType.name,
                field: info.fieldName,
                error: JSON.stringify(err),
            });
        }

        if (err instanceof PublicError) throw err;
        else throw new Error("an internal error has occured");
    }
};

export const LoggingInterceptor: MiddlewareFn<Context> = async (
    { context, info },
    next
) => {
    const startTime = Date.now();
    try {
        await next();
    } finally {
        const endTime = Date.now();
        if (!info.path.prev)
            context.logger.info("new operation", {
                operation: info.operation.name?.value || "",
                requestTime: endTime - startTime,
                type: info.operation.operation,
            });
    }
};
