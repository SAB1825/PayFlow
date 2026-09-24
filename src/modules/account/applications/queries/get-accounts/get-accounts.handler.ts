import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMyAccountsQuery } from './get-accounts.query';
import { Account } from '../../../domain/entities/account.entity';
import { Inject } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from '../../ports/account-repository.port';
import { AccountRepository } from '../../../infrastructure/account.repository';
import { UserId } from '../../../../identity/domain/value-object/user-id.vo';

@QueryHandler(GetMyAccountsQuery)
export class GetMyAccountsHandler implements IQueryHandler<
  GetMyAccountsQuery,
  Account[]
> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(query: GetMyAccountsQuery): Promise<Account[]> {
    const userId = UserId.fromString(query.userId);
    const accounts = await this.accountRepository.findByUserId(userId);

    return accounts;
  }
}
