import { Provider } from '@nestjs/common';
import { DRIZZLE_DB } from './drizzle.types';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ConfigService } from '@nestjs/config';
import * as schema from './schemas';
import { attachSqlLogging } from '../logging/sql-logger';

export const DrizzleDbProvider: Provider = {
  provide: DRIZZLE_DB,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');
    const pool = new Pool({
      connectionString,
    });
    attachSqlLogging(pool);
    return drizzle(pool, { schema });
  },
};
