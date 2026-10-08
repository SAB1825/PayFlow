/**
 * Central configuration for the logging system.
 *
 * All values are read once from the environment (see `.env.example`):
 *
 * - `LOG_LEVEL`    silent | error | warn | log | debug | verbose (aliases: info, trace)
 * - `LOG_FORMAT`   json | pretty | auto (auto = json in production, pretty otherwise)
 * - `LOG_HTTP`     true | false  — log every HTTP request/response
 * - `LOG_SQL`      true | false  — log database queries
 * - `LOG_SQL_PARAMS` true | false — include query parameters (may contain sensitive values)
 * - `SLOW_QUERY_MS`  number      — queries slower than this are logged as warnings
 */
export type LogFormat = 'json' | 'pretty';
export type LogLevelName =
  | 'silent'
  | 'error'
  | 'warn'
  | 'log'
  | 'debug'
  | 'verbose';

/** Ordered from least to most verbose. `silent` disables all output. */
export const LEVEL_ORDER: Record<LogLevelName | 'fatal', number> = {
  silent: -1,
  error: 0,
  fatal: 0,
  warn: 1,
  log: 2,
  debug: 3,
  verbose: 4,
};

export interface LogConfig {
  /** Configured minimum level. */
  level: LogLevelName;
  /** Numeric threshold derived from `level`. */
  threshold: number;
  format: LogFormat;
  /** Whether ANSI colors may be emitted. */
  color: boolean;
  http: boolean;
  sql: boolean;
  sqlParams: boolean;
  slowQueryMs: number;
}

const LEVEL_ALIASES: Record<string, LogLevelName> = {
  info: 'log',
  trace: 'verbose',
  none: 'silent',
};

function readLevel(): LogLevelName {
  const raw = (process.env.LOG_LEVEL ?? 'log').trim().toLowerCase();
  const level = LEVEL_ALIASES[raw] ?? (raw as LogLevelName);
  return level in LEVEL_ORDER ? level : 'log';
}

function readFormat(): LogFormat {
  const raw = (process.env.LOG_FORMAT ?? 'auto').trim().toLowerCase();
  if (raw === 'json' || raw === 'pretty') return raw;
  return process.env.NODE_ENV === 'production' ? 'json' : 'pretty';
}

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === '') return fallback;
  return !['0', 'false', 'no', 'off'].includes(raw);
}

function readPositiveNumber(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function buildConfig(): LogConfig {
  const level = readLevel();
  const format = readFormat();
  return {
    level,
    threshold: LEVEL_ORDER[level],
    format,
    color: format === 'pretty' && process.stdout.isTTY === true && !process.env.NO_COLOR,
    http: readBool('LOG_HTTP', true),
    sql: readBool('LOG_SQL', false),
    sqlParams: readBool('LOG_SQL_PARAMS', false),
    slowQueryMs: readPositiveNumber('SLOW_QUERY_MS', 200),
  };
}

let cached: LogConfig | undefined;

/**
 * Returns the process-wide log configuration (read once, then cached).
 * Use {@link resetLogConfig} in tests that change the relevant env vars.
 */
export function getLogConfig(): LogConfig {
  cached ??= buildConfig();
  return cached;
}

export function resetLogConfig(): void {
  cached = undefined;
}
