import { Global, Module } from '@nestjs/common';
import { DrizzleDbProvider } from './drizzle.provider';
import { DRIZZLE_DB } from './drizzle.types';
import { UNIT_OF_WORK } from '../../application/unit-of-work.port';
import { DrizzleUnitOfWork } from './drizzle-unit-work';

@Global()
@Module({
  providers: [
    DrizzleDbProvider,
    {
      provide: UNIT_OF_WORK,
      useClass: DrizzleUnitOfWork,
    },
  ],
  exports: [DRIZZLE_DB, UNIT_OF_WORK],
})
export class DrizzleModule {}
