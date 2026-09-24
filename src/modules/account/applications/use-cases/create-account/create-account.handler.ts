import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAccountCommand } from './create-account.command';
import { Inject } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../../../../identity/application/ports/user-repository.port';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from '../../ports/account-repository.port';
import { UserId } from '../../../../identity/domain/value-object/user-id.vo';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../../shared/domain/exception/application.exception';
import { Account } from '../../../domain/entities/account.entity';

@CommandHandler(CreateAccountCommand)
export class CreateAccountHandler implements ICommandHandler<
  CreateAccountCommand,
  void
> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(command: CreateAccountCommand): Promise<void> {
    const userId = UserId.fromString(command.userId);
    const existingUser = await this.userRepository.findById(userId);

    if (!existingUser) {
      throw new ApplicationException(
        'User not found for the given id',
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    const account = Account.create(userId, command.accountType, 'INR');

    await this.accountRepository.create(account);
  }
}
