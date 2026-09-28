import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetByIdQuery } from './get-by-id.query';
import { Transfer } from '../../../domain/entities/transfer.entity';
import { Inject } from '@nestjs/common';
import {
  TRANSFER_REPOSITORY,
  type TransferRepositoryPort,
} from '../../ports/transfer.repository.port';
import { UserId } from '../../../../identity/domain/value-object/user-id.vo';
import { TransferId } from '../../../domain/value-objects/transfer-id.vo';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../../shared/domain/exception/application.exception';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from '../../../../account/applications/ports/account-repository.port';

@QueryHandler(GetByIdQuery)
export class GetByIdHandler implements IQueryHandler<GetByIdQuery, Transfer> {
  constructor(
    @Inject(TRANSFER_REPOSITORY)
    private readonly transferRepository: TransferRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(query: GetByIdQuery): Promise<Transfer> {
    const userId = UserId.fromString(query.userId);
    const transferId = TransferId.fromString(query.transferId);

    const transfer = await this.transferRepository.findById(transferId);
    if (!transfer)
      throw new ApplicationException(
        'Transfer not found',
        ApplicationExceptionCode.NOT_FOUND,
      );

    const myAccounts = await this.accountRepository.findByUserId(userId);
    const isParticipant = myAccounts.some(
      (a) =>
        a.id.equals(transfer.fromAccountId) ||
        a.id.equals(transfer.toAccountId),
    );
    if (!isParticipant)
      throw new ApplicationException(
        'You are not authorized to view this.',
        ApplicationExceptionCode.UNAUTHORIZED,
      );

    return transfer;
  }
}
