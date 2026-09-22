import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './shared/infrastructure/database/drizzle.module';
import { UserModule } from './modules/identity/user.module';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [
    CqrsModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    UserModule,
  ],
  providers: [],
})
export class AppModule {}
