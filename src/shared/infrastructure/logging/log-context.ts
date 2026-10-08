import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request-scoped log context (correlation id, method, path) stored in an
 * AsyncLocalStorage so every log line emitted while handling a request —
 * including database queries and event handlers — carries the same
 * `requestId` without passing it around explicitly.
 */
export interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
}

const storage = new AsyncLocalStorage<LogContext>();

/** Runs `fn` with the given log context; everything it awaits keeps the context. */
export function runWithLogContext<T>(context: LogContext, fn: () => T): T {
  return storage.run(context, fn);
}

/** Current request correlation id, if inside a request. */
export function currentRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

/** Current request context, if inside a request. */
export function getLogContext(): LogContext | undefined {
  return storage.getStore();
}
