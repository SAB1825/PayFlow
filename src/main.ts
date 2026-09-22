import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DomainExceptioFilter } from './shared/infrastructure/filter/domain-exception.filter';
import { ApplicationExceptionFilter } from './shared/infrastructure/filter/application-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  app.useGlobalFilters(
    new DomainExceptioFilter(),
    new ApplicationExceptionFilter(),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
