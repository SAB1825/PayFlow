import { Global, Module } from '@nestjs/common';
import { AppLogger } from './app-logger.service';
import { AppLifecycleLogger } from './app-lifecycle.logger';
import { HttpLoggerMiddleware } from './http-logger.middleware';

/**
 * Global logging module: `AppLogger` can be injected anywhere without
 * importing this module explicitly.
 */
@Global()
@Module({
  providers: [AppLogger, AppLifecycleLogger, HttpLoggerMiddleware],
  exports: [AppLogger],
})
export class LoggingModule {}
