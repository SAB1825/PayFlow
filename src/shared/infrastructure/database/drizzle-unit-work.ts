import { Inject, Injectable } from '@nestjs/common';
import {
  TransactionHandle,
  UnitOfWorkPort,
} from '../../application/unit-of-work.port';
import { DRIZZLE_DB, type DrizzleDatabase } from './drizzle.types';

@Injectable()
export class DrizzleUnitOfWork implements UnitOfWorkPort {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase) {}

  async runInTransaction<T>(
    work: (tx: TransactionHandle) => Promise<T>,
  ): Promise<T> {
    return await this.db.transaction((tx) => work(tx));
  }
}
