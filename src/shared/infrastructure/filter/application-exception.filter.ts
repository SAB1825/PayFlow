import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../domain/exception/application.exception';
import type { Response } from 'express';
import { AppLogger } from '../logging/app-logger.service';

const CODE_TO_HTTP: Record<ApplicationExceptionCode, HttpStatus> = {
  [ApplicationExceptionCode.VALIDATION_EXCEPTION]: HttpStatus.BAD_REQUEST,
  [ApplicationExceptionCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ApplicationExceptionCode.CONFLICT]: HttpStatus.CONFLICT,
  [ApplicationExceptionCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED
};

@Catch(ApplicationException)
export class ApplicationExceptionFilter implements ExceptionFilter {
  private readonly logger = new AppLogger('ApplicationExceptionFilter');

  catch(exception: ApplicationException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      CODE_TO_HTTP[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const meta = { status, code: exception.code };
    if (status >= 500) {
      this.logger.error(exception.message, meta, exception.stack);
    } else {
      this.logger.warn(exception.message, meta);
    }
    response.status(status).json({
      statusCode: status,
      messages: exception.message,
    });
  }
}