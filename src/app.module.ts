import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './shared/infrastructure/database/drizzle.module';
import { UserModule } from './modules/identity/user.module';
import { CqrsModule } from '@nestjs/cqrs';
import { APP_GUARD } from '@nestjs/core';
import { AuthGaurd } from './shared/infrastructure/gaurds/auth.gaurd';
import { JwtModule } from '@nestjs/jwt';
import { AccountModule } from './modules/account/account.module';
import { TransferModule } from './modules/transfer/transfer.module';
import { BeneficiaryModule } from './modules/beneficiary/beneficiary.module';
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler"

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    CqrsModule.forRoot(),
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    UserModule,
    AccountModule,
    TransferModule,
    BeneficiaryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGaurd,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule { }
