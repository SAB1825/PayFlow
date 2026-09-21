import { Provider } from '@nestjs/common';
import { DRIZZLE_DB } from './drizzle.types';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ConfigService } from '@nestjs/config';
import * as schema from './schemas';

export const DrizzleDbProvider: Provider = {
  provide: DRIZZLE_DB,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');
    const pool = new Pool({
      connectionString,
    });
    return drizzle(pool, { schema });
  },
};
