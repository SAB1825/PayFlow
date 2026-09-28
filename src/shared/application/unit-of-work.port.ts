export type TransactionHandle = unknown;

export interface UnitOfWorkPort {
  runInTransaction<T>(work: (tx: TransactionHandle) => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
