import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { DomainException } from '../../domain/exception/domain.exception';
import { Response } from 'express';
import { AppLogger } from '../logging/app-logger.service';

@Catch(DomainException)
export class DomainExceptioFilter implements ExceptionFilter {
  private readonly logger = new AppLogger('DomainExceptionFilter');

  catch(exception: DomainException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    this.logger.warn(exception.message, {
      status: HttpStatus.BAD_REQUEST,
      exception: exception.name,
    });
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
    });
  }
}