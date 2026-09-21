import { Global, Module } from '@nestjs/common';
import { DrizzleDbProvider } from './drizzle.provider';
import { DRIZZLE_DB } from './drizzle.types';

@Global()
@Module({
  providers: [DrizzleDbProvider],
  exports: [DRIZZLE_DB],
})
export class DrizzleModule {}
