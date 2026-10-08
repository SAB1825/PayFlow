import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DomainExceptioFilter } from './shared/infrastructure/filter/domain-exception.filter';
import { ApplicationExceptionFilter } from './shared/infrastructure/filter/application-exception.filter';
import { UnhandledExceptionFilter } from './shared/infrastructure/filter/unhandled-exception.filter';
import { AppLogger } from './shared/infrastructure/logging/app-logger.service';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new AppLogger('Nest');
  const app = await NestFactory.create(AppModule, { logger });
  app.useLogger(logger);
  app.enableShutdownHooks();
  app.use(cookieParser())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  // Global filters are evaluated in reverse registration order, so the
  // catch-all must come first here to run after the specific filters.
  app.useGlobalFilters(
    new UnhandledExceptionFilter(),
    new DomainExceptioFilter(),
    new ApplicationExceptionFilter(),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.child('Bootstrap').log(`listening on http://localhost:${port}`);
}
bootstrap();
