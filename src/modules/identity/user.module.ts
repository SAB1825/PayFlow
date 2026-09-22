import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserController } from './presentation/user.controller';
import { CommandHandler } from './application/use-cases';
import { PASSWORD_HASHER } from './application/ports/password-hasher';
import { Argon2PasswordHasher } from './infrastructure/adapter/hash-password.repository';
import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { UserRepository } from './infrastructure/adapter/user.repository';

@Module({
  imports: [CqrsModule],
  controllers: [UserController],
  providers: [
    ...CommandHandler,
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasher,
    },
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
})
export class UserModule {}
