// import { Inject, Injectable } from '@nestjs/common';
// import { DRIZZLE_DB, type DrizzleDatabase } from './drizzle.types';
// import { UnitOfWorkPort } from '../../application/unit-of-work.port';
// 
// // shared/infrastructure/database/drizzle-unit-of-work.ts
// @Injectable()
// export class DrizzleUnitOfWork implements UnitOfWorkPort {
//   constructor(private readonly db: DrizleDB) {}
// 
//   async executeTransaction<T>(
//     work: (tx: DrizzleDatabase) => Promise<T>,
//   ): Promise<T> {
//     return this.db.transaction(async (tx) => work(tx));
//   }
// }
