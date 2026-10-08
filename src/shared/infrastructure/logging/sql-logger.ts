import type { Pool, PoolClient } from 'pg';
import { AppLogger } from './app-logger.service';
import { getLogConfig, type LogConfig } from './log-config';

/** Query text is logged truncated; params only when `LOG_SQL_PARAMS=true`. */
const MAX_SQL_LENGTH = 1000;

const patchedTargets = new WeakSet<object>();

type QueryLike = (...args: unknown[]) => unknown;

function extractSqlAndParams(
  args: unknown[],
): { sql: string | undefined; params: unknown } {
  const first = args[0];
  if (typeof first === 'string') {
    const second = args[1];
    return { sql: first, params: Array.isArray(second) ? second : undefined };
  }
  if (first && typeof first === 'object') {
    const config = first as { text?: unknown; values?: unknown };
    if (typeof config.text === 'string') {
      return { sql: config.text, params: config.values };
    }
  }
  return { sql: undefined, params: undefined };
}

function rowCountOf(result: unknown): number | undefined {
  const rowCount = (result as { rowCount?: unknown } | null | undefined)?.rowCount;
  return typeof rowCount === 'number' ? rowCount : undefined;
}

function report(
  logger: AppLogger,
  config: LogConfig,
  sql: string | undefined,
  params: unknown,
  error: unknown,
  durationMs: number,
  rowCount: number | undefined,
): void {
  if (!sql) return;
  const duration = Math.round(durationMs * 100) / 100;
  const text =
    sql.length > MAX_SQL_LENGTH ? `${sql.slice(0, MAX_SQL_LENGTH)}…` : sql;
  const meta: Record<string, unknown> = { durationMs: duration };
  if (rowCount !== undefined) meta.rowCount = rowCount;
  if (config.sqlParams && params !== undefined) {
    // Redaction happens inside AppLogger, but array elements are logged as-is:
    // only enable this outside development.
    meta.params = params;
  }

  if (error) {
    logger.error(`query failed: ${text}`, {
      ...meta,
      error: error instanceof Error ? error.message : String(error),
    });
  } else if (duration >= config.slowQueryMs) {
    logger.warn(`slow query: ${text}`, meta);
  } else {
    logger.debug(text, meta);
  }
}

/**
 * Wraps `query` on the target so every call is timed and logged exactly once.
 * Supports both callback-style (used internally by pg's Pool) and
 * promise/thenable-style (used by drizzle) calls.
 */
function patchQueryTarget(target: object, logger: AppLogger): void {
  if (patchedTargets.has(target)) return;
  const query = (target as { query?: QueryLike }).query;
  if (typeof query !== 'function') return;
  patchedTargets.add(target);

  const config = getLogConfig();
  (target as { query: QueryLike }).query = function patchedQuery(
    this: unknown,
    ...args: unknown[]
  ): unknown {
    const { sql, params } = extractSqlAndParams(args);
    const start = performance.now();
    const finish = (error: unknown, result?: unknown): void =>
      report(
        logger,
        config,
        sql,
        params,
        error,
        performance.now() - start,
        error ? undefined : rowCountOf(result),
      );

    const last = args[args.length - 1];
    if (typeof last === 'function') {
      args[args.length - 1] = function patchedCallback(
        this: unknown,
        error: unknown,
        result: unknown,
      ): void {
        finish(error, result);
        (last as (e: unknown, r: unknown) => void).call(this, error, result);
      };
      return query.apply(this, args);
    }

    const out = query.apply(this, args);
    if (out && typeof (out as PromiseLike<unknown>).then === 'function') {
      void Promise.resolve(out).then(
        (result) => finish(null, result),
        (error) => finish(error),
      );
    }
    return out;
  };
}

/**
 * Attaches database logging to a pg Pool:
 * - always logs idle-client connection errors (an unhandled `error` event
 *   would otherwise crash the process),
 * - when `LOG_SQL=true`, times every query on every pooled client (including
 *   transaction clients) and logs it at `debug`, or `warn` when slower than
 *   `SLOW_QUERY_MS`.
 */
export function attachSqlLogging(pool: Pool): void {
  const logger = new AppLogger('SQL');

  pool.on('error', (error: Error) => {
    logger.error('idle client connection error', {
      error: error.message,
      stack: error.stack,
    });
  });

  if (!getLogConfig().sql) return;

  pool.on('connect', (client: PoolClient) => patchQueryTarget(client, logger));
}
