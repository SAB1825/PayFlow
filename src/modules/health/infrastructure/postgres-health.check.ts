import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { HealthCheck } from '../application/ports/health-check.port';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../../../shared/infrastructure/database/drizzle.types';

/**
 * Drizzle wraps driver failures as `Failed query: ...`, hiding the root
 * cause. Unwrap it so probe payloads stay actionable, and expand the
 * empty-message `AggregateError` `pg` throws for dual-stack connect
 * failures into its per-address errors.
 */
function unwrapDriverError(error: unknown): unknown {
  const cause = (error as { cause?: unknown }).cause;
  const root = cause instanceof Error ? cause : error;

  if (root instanceof AggregateError && !root.message) {
    const messages = root.errors.map((inner) => inner.message).filter(Boolean);
    if (messages.length > 0) return new Error(messages.join('; '));
  }
  return root;
}

/** Verifies the application can reach Postgres through the shared pool. */
@Injectable()
export class PostgresHealthCheck implements HealthCheck {
  readonly name = 'postgres';

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: DrizzleDatabase,
  ) {}

  async run(): Promise<void> {
    try {
      await this.db.execute(sql`select 1`);
    } catch (error) {
      throw unwrapDriverError(error);
    }
  }
}
