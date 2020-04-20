export class PublicError extends Error {}

export function assertNotNull<T>(value: T | null | undefined): T {
    if (value === null || value === undefined) {
        throw new Error("value was null");
    }
    return value;
}
