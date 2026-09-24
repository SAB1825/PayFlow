import { Module } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from './applications/ports/account-repository.port';
import { AccountRepository } from './infrastructure/account.repository';
import { CommandHandlers } from './applications/use-cases';
import { CqrsModule } from '@nestjs/cqrs';
import { AccountController } from './presentation/account.controller';
import { UserModule } from '../identity/user.module';
import { QueryHandlers } from './applications/queries';

@Module({
  imports: [CqrsModule, UserModule],
  controllers: [AccountController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: AccountRepository,
    },
  ],
})
export class AccountModule {}
