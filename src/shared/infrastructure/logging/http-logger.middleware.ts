import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { AppLogger } from './app-logger.service';
import { getLogConfig } from './log-config';
import { runWithLogContext } from './log-context';

/** Correlation id header; honored when well-formed, always echoed back. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Accepted incoming ids: short, URL-safe, no injection surprises. */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * Logs every HTTP request once the response has finished and binds a
 * correlation `requestId` (incoming `x-request-id` or a fresh uuid) for the
 * whole request scope — including queries and handlers that run later.
 */
@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger.child('HTTP');
  }

  use(req: Request, res: Response, next: () => void): void {
    const incoming = req.header(REQUEST_ID_HEADER);
    const requestId =
      incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, requestId);

    const start = performance.now();
    let logged = false;
    const logResponse = (aborted: boolean): void => {
      if (logged) return;
      logged = true;
      if (!getLogConfig().http) return;

      const status = res.statusCode;
      const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'log';
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const message = `${req.method} ${req.path} -> ${status}${aborted ? ' (client aborted)' : ''}`;

      // `finish`/`close` may fire outside the AsyncLocalStorage scope, so the
      // correlation id is passed explicitly here.
      this.logger[level](message, {
        requestId,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query),
        status,
        durationMs,
        ip: req.ip,
      });
    };

    res.on('finish', () => logResponse(false));
    res.on('close', () => logResponse(!res.writableEnded));

    runWithLogContext(
      { requestId, method: req.method, path: req.path },
      () => next(),
    );
  }
}
