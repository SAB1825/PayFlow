export type TransactionHandler = unknown;
export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');

export interface UnitOfWorkPort {
  executeTransaction<T>(
    work: (tx: TransactionHandler) => Promise<T>,
  ): Promise<T>;
}
