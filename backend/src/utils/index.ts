import { EntityManager } from "typeorm";
import { logger } from "../logging";

export class PublicError extends Error {}

export function assertNotNull<T>(value: T | null | undefined): T {
    if (value === null || value === undefined) {
        throw new Error("value was null");
    }
    return value;
}

/**
 * small wrapper over manager.transaction
 * so that that nested transactions are  are flattened
 */
export function createTransaction<V>(
    manager: EntityManager,
    transaction: (manager: EntityManager) => Promise<V>
): Promise<V> {
    if (manager.queryRunner && manager.queryRunner.isTransactionActive) {
        return transaction(manager);
    }
    return manager.transaction(transaction);
}

type Thunk<T> = () => Promise<T>;
/**
 * forces a series of Thunks to be guaranteed to evaluate serially
 */
export class Serial<T, E = Error> {
    private successes: T[] = [];
    private errors: E[] = [];
    private processing?: Promise<number>;

    push(thunk: Thunk<T>) {
        this.processing = (this.processing
            ? this.processing.then(thunk)
            : thunk()
        )
            .then(this.successes.push)
            .catch(this.errors.push);
    }

    async done(): Promise<[T[], E[]]> {
        if (this.processing) await this.processing;
        return [this.successes, this.errors];
    }
}
