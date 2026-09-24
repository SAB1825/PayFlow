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
import { AccountNumber } from '../../../domain/value-objects/account-number.vo';

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
    const accNumber = AccountNumber.fromString(query.accountNumber);
    const account = await this.accountRepository.findByNumber(accNumber);

    if (!account)
      throw new ApplicationException("Account doesn't for the given id");

    const isValid = userId.equals(account.userId);
    if (!isValid)
      throw new ApplicationException(
        'You dont have access',
        ApplicationExceptionCode.UNAUTHORIZED,
      );

    return account;
  }
}
