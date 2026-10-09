import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ApplicationExceptionFilter } from './shared/infrastructure/filter/application-exception.filter';
import { DomainExceptioFilter } from './shared/infrastructure/filter/domain-exception.filter';
import { UnhandledExceptionFilter } from './shared/infrastructure/filter/unhandled-exception.filter';

/**
 * Versioned prefix for every business route. Doing it once, here, keeps the
 * surface consistent: no module can accidentally expose an unversioned path.
 */
export const API_PREFIX = 'api/v1';

/**
 * Everything that shapes the HTTP surface: route prefix, cookie parsing,
 * request validation and exception filters.
 *
 * Shared by `main.ts` and the e2e tests so the routes the tests exercise are
 * exactly the routes the server exposes.
 */
export function setupHttpApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX, {
    // Probe paths are configured on orchestrators and load balancers, so they
    // are kept at the root instead of living behind the versioned prefix.
    exclude: ['health', 'health/(.*)'],
  });

  app.use(cookieParser());
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
}
