import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAccountQuery } from './get-account.query';
import { Account } from '../../../domain/entities/account.entity';
import { Inject } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from '../../ports/account-repository.port';
import { AccountId } from '../../../domain/value-objects/account-id.vo';
import { UserId } from '../../../../identity/domain/value-object/user-id.vo';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../../shared/domain/exception/application.exception';

@QueryHandler(GetAccountQuery)
export class GetAccountHandler implements IQueryHandler<
  GetAccountQuery,
  Account
> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(query: GetAccountQuery): Promise<Account> {
    const userId = UserId.fromString(query.userId);
    const accountId = AccountId.fromString(query.accountId);
    const account = await this.accountRepository.findById(accountId);

    if (!account)
      throw new ApplicationException(
        "Account doesn't exist for the given id",
        ApplicationExceptionCode.NOT_FOUND,
      );

    const isValid = userId.equals(account.userId);
    if (!isValid)
      throw new ApplicationException(
        'You dont have access',
        ApplicationExceptionCode.UNAUTHORIZED,
      );

    return account;
  }
}
