import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './shared/infrastructure/logging/app-logger.service';
import { setupHttpApp } from './app.setup';

async function bootstrap() {
  const logger = new AppLogger('Nest');
  const app = await NestFactory.create(AppModule, { logger });
  app.useLogger(logger);
  app.enableShutdownHooks();
  setupHttpApp(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.child('Bootstrap').log(`listening on http://localhost:${port}`);
}
bootstrap();
