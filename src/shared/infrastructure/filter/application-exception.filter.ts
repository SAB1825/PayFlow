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

const CODE_TO_HTTP: Record<ApplicationExceptionCode, HttpStatus> = {
  [ApplicationExceptionCode.VALIDATION_EXCEPTION]: HttpStatus.BAD_REQUEST,
  [ApplicationExceptionCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ApplicationExceptionCode.CONFLICT]: HttpStatus.CONFLICT,
  [ApplicationExceptionCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED
};

@Catch(ApplicationException)
export class ApplicationExceptionFilter implements ExceptionFilter {
  catch(exception: ApplicationException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      CODE_TO_HTTP[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      statusCode: status,
      messages: exception.message,
    });
  }
}