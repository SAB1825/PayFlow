import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './shared/infrastructure/database/drizzle.module';
import { UserModule } from './modules/identity/user.module';
import { CqrsModule } from '@nestjs/cqrs';
import { APP_GUARD } from '@nestjs/core';
import { AuthGaurd } from './shared/infrastructure/gaurds/auth.gaurd';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    CqrsModule.forRoot(),
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGaurd,
    },
  ],
})
export class AppModule {}
