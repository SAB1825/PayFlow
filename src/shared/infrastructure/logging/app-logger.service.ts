import {
  Inject,
  Injectable,
  Optional,
  type LoggerService,
  type LogLevel,
} from '@nestjs/common';
import { currentRequestId } from './log-context';
import { LEVEL_ORDER, getLogConfig } from './log-config';

/** Token for the optional constructor context, so DI resolves it predictably. */
export const LOGGER_CONTEXT = Symbol('LOGGER_CONTEXT');

/** Level names used in emitted records (pino/OpenTelemetry style). */
type OutputLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

const OUTPUT_TO_NEST: Record<OutputLevel, LogLevel> = {
  fatal: 'fatal',
  error: 'error',
  warn: 'warn',
  info: 'log',
  debug: 'debug',
  trace: 'verbose',
};

const ANSI = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
} as const;

const LEVEL_STYLE: Record<OutputLevel, string> = {
  fatal: ANSI.red,
  error: ANSI.red,
  warn: ANSI.yellow,
  info: ANSI.cyan,
  debug: ANSI.magenta,
  trace: ANSI.gray,
};

const CONTEXT_STYLES = [ANSI.cyan, ANSI.green, ANSI.yellow, ANSI.blue, ANSI.magenta];

/** Keys whose values are masked before reaching the output. */
const SENSITIVE_KEY =
  /pass|secret|token|authorization|cookie|api[-_]?key|private[-_]?key|credential|cvv|cvc|ssn|card[-_]?number/i;

/** Mirrors Nest's own detection of a stack-trace string argument. */
const STACK_FORMAT = /^(.)+\n\s+at .+:\d+:\d+/;

interface ParsedLog {
  context: string;
  messages: string[];
  meta?: Record<string, unknown>;
  stack?: string;
}

function isStackFormat(value: unknown): value is string {
  return (
    (typeof value === 'string' || value === undefined) &&
    STACK_FORMAT.test(value as string)
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Recursively masks sensitive keys and serializes awkward values. */
function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= 6) return '[Object]';
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (value instanceof Date) return value.toISOString();
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1, seen));
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(entry, depth + 1, seen);
    }
    return out;
  }
  try {
    return String(value);
  } catch {
    return '[Object]';
  }
}

function stringify(value: unknown): string {
  try {
    const result = JSON.stringify(redact(value));
    return result ?? String(value);
  } catch {
    return String(value);
  }
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, '0');
}

function localTime(date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

function contextStyle(context: string): string {
  let hash = 0;
  for (const char of context) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return CONTEXT_STYLES[Math.abs(hash) % CONTEXT_STYLES.length];
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || typeof value !== 'object') return String(value);
  const json = stringify(value);
  return json.length > 300 ? `${json.slice(0, 300)}…` : json;
}

/**
 * Application logger implementing Nest's `LoggerService`.
 *
 * - JSON lines when `LOG_FORMAT=json` (production default), colorized text otherwise.
 * - Level filtering via `LOG_LEVEL`.
 * - Automatically attaches the correlation `requestId` of the current HTTP request.
 * - Masks sensitive values (`password`, `token`, `secret`, …) in structured params.
 *
 * Usage (per-class context):
 * ```ts
 * private readonly logger = new AppLogger(UserService.name);
 * this.logger.log('registered', { userId: user.id });
 * ```
 * Or via DI with the shared instance:
 * ```ts
 * constructor(private readonly logger: AppLogger) {}
 * this.logger.child(UserService.name).log('registered');
 * ```
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly context: string;
  private enabledLevels?: LogLevel[];

  constructor(@Optional() @Inject(LOGGER_CONTEXT) context?: string) {
    this.context = context ?? 'Application';
  }

  /** Logger bound to a specific context (e.g. a class name). */
  child(context: string): AppLogger {
    const child = new AppLogger(context);
    child.enabledLevels = this.enabledLevels;
    return child;
  }

  /** Nest calls this when `Logger.setLogLevels()` is used; intersects with `LOG_LEVEL`. */
  setLogLevels(levels: LogLevel[]): void {
    this.enabledLevels = [...levels];
  }

  isLevelEnabled(level: LogLevel): boolean {
    const config = getLogConfig();
    if (LEVEL_ORDER[level] > config.threshold) return false;
    return !this.enabledLevels || this.enabledLevels.includes(level);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('trace', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('fatal', message, optionalParams);
  }

  /**
   * Splits Nest-style call arguments into context / messages / structured
   * params / stack. Mirrors `ConsoleLogger` conventions: a trailing string is
   * the context (unless it looks like a stack trace), plain objects become
   * structured fields.
   */
  private parse(message: unknown, optionalParams: unknown[]): ParsedLog {
    const rest = [...optionalParams];
    let stack: string | undefined;

    if (rest.length > 0 && isStackFormat(rest[rest.length - 1])) {
      stack = rest.pop() as string;
    }
    let context = this.context;
    if (rest.length > 0 && typeof rest[rest.length - 1] === 'string') {
      context = rest.pop() as string;
    }

    const messages: string[] = [];
    const metaParts: Record<string, unknown>[] = [];
    let error: Error | undefined;

    const push = (value: unknown): void => {
      if (value === undefined || value === null) return;
      if (value instanceof Error) {
        error = value;
        messages.push(value.message);
        return;
      }
      if (typeof value === 'object') {
        if (isPlainObject(value)) {
          metaParts.push(value);
        } else {
          messages.push(stringify(value));
        }
        return;
      }
      messages.push(String(value));
    };

    push(message);
    for (const param of rest) push(param);

    stack ??= error?.stack;
    return {
      context,
      messages,
      meta: metaParts.length > 0 ? Object.assign({}, ...metaParts) : undefined,
      stack,
    };
  }

  private write(
    level: OutputLevel,
    message: unknown,
    optionalParams: unknown[],
  ): void {
    if (!this.isLevelEnabled(OUTPUT_TO_NEST[level])) return;

    const config = getLogConfig();
    const { context, messages, meta, stack } = this.parse(message, optionalParams);
    const requestId = currentRequestId();

    // The caller may pass the correlation id explicitly (e.g. response
    // listeners that run outside the AsyncLocalStorage scope); the
    // request-scoped id wins, so drop the duplicate.
    if (requestId && meta && meta.requestId === requestId) {
      delete meta.requestId;
    }

    const line =
      config.format === 'json'
        ? this.toJson(level, context, messages, meta, stack, requestId)
        : this.toPretty(config.color, level, context, messages, meta, stack, requestId);

    process.stdout.write(`${line}\n`);
  }

  private toJson(
    level: OutputLevel,
    context: string,
    messages: string[],
    meta: Record<string, unknown> | undefined,
    stack: string | undefined,
    requestId: string | undefined,
  ): string {
    const record: Record<string, unknown> = {};
    if (meta) Object.assign(record, redact(meta));
    record.time = new Date().toISOString();
    record.level = level;
    record.context = context;
    if (requestId) record.requestId = requestId;
    if (messages.length > 0) record.message = messages.join(' ');
    if (stack) record.stack = stack;

    try {
      return JSON.stringify(record);
    } catch {
      return JSON.stringify({
        time: new Date().toISOString(),
        level,
        context,
        message: messages.join(' '),
      });
    }
  }

  private toPretty(
    color: boolean,
    level: OutputLevel,
    context: string,
    messages: string[],
    meta: Record<string, unknown> | undefined,
    stack: string | undefined,
    requestId: string | undefined,
  ): string {
    const paint = (style: string, text: string): string =>
      color ? `${style}${text}${ANSI.reset}` : text;

    const parts = [
      paint(ANSI.gray, localTime()),
      paint(LEVEL_STYLE[level], level.toUpperCase().padEnd(5)),
      paint(contextStyle(context), `[${context}]`),
    ];
    if (messages.length > 0) parts.push(messages.join(' '));
    if (meta) {
      for (const [key, value] of Object.entries(redact(meta) as Record<string, unknown>)) {
        parts.push(`${key}=${formatValue(value)}`);
      }
    }
    if (requestId) parts.push(paint(ANSI.gray, `rid=${requestId}`));

    const line = parts.join(' ');
    return stack ? `${line}\n${paint(ANSI.gray, stack)}` : line;
  }
}
