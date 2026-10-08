import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppLogger } from '../logging/app-logger.service';

/**
 * Safety net for every exception no other filter handles. Logs the full
 * context (route, status, stack) and returns a generic 500 for unexpected
 * errors without leaking internals to the client.
 *
 * Note on ordering: Nest evaluates global filters in *reverse* registration
 * order, so this catch-all is registered first in `main.ts` and therefore
 * runs last.
 */
@Catch()
export class UnhandledExceptionFilter implements ExceptionFilter {
  private readonly logger = new AppLogger('UnhandledExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const isHttp = host.getType() === 'http';
    const message = this.describe(exception);
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    if (!isHttp) {
      this.log(status, message, exception, undefined);
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const route = { method: request.method, path: request.path };

    this.log(status, message, exception, route);

    if (response.headersSent) return;
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      response
        .status(status)
        .json(typeof body === 'string' ? { statusCode: status, message: body } : body);
      return;
    }
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }

  private describe(exception: unknown): string {
    return exception instanceof Error ? exception.message : String(exception);
  }

  private log(
    status: number,
    message: string,
    exception: unknown,
    route: { method: string; path: string } | undefined,
  ): void {
    const meta: Record<string, unknown> = { status, ...route };
    const summary = route
      ? `${route.method} ${route.path} -> ${status}: ${message}`
      : `${status}: ${message}`;

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      // stack goes last: the logger detects trailing stack-trace strings.
      this.logger.error(summary, meta, stack);
      return;
    }
    this.logger.warn(summary, meta);
  }
}
