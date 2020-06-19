import { EntityManager } from "typeorm";

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
