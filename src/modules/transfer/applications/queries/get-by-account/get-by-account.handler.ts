import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetByAccountQuery } from './get-by-account.command';
import { Transfer } from '../../../domain/entities/transfer.entity';
import { Inject } from '@nestjs/common';
import {
  TRANSFER_REPOSITORY,
  type TransferRepositoryPort,
} from '../../ports/transfer.repository.port';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from '../../../../account/applications/ports/account-repository.port';
import { UserId } from '../../../../identity/domain/value-object/user-id.vo';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../../shared/domain/exception/application.exception';
import { AccountId } from '../../../../account/domain/value-objects/account-id.vo';

@QueryHandler(GetByAccountQuery)
export class GetByAccountHandler implements IQueryHandler<
  GetByAccountQuery,
  Transfer[]
> {
  constructor(
    @Inject(TRANSFER_REPOSITORY)
    private readonly transferRepository: TransferRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(query: GetByAccountQuery): Promise<Transfer[]> {
    // const accounts = await this.accountRepository.findByUserId(
    //   UserId.fromString(query.userId),
    // );
    // console.log(accounts);
    // const myAccount = accounts.find((a) =>
    //   a.id.equals(AccountId.fromString(query.accountId)),
    // );
    // console.log(myAccount);
    const userId = UserId.fromString(query.userId);
    const accountId = AccountId.fromString(query.accountId);
    const account = await this.accountRepository.findById(accountId);
    if (!account)
      throw new ApplicationException(
        'Account not found for the given id',
        ApplicationExceptionCode.NOT_FOUND,
      );

    if (!account.userId.equals(userId))
      throw new ApplicationException(
        'You are not authorized to view this.',
        ApplicationExceptionCode.UNAUTHORIZED,
      );

    const transfers = await this.transferRepository.findByAccountId(
      AccountId.fromString(query.accountId),
    );

    return transfers;
  }
}
