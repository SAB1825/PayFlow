import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransferCommand } from './transfer.command';
import { Transfer } from '../../../domain/entities/transfer.entity';
import { Inject } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from '../../../../account/applications/ports/account-repository.port';
import {
  TRANSFER_REPOSITORY,
  type TransferRepositoryPort,
} from '../../ports/transfer.repository.port';
import { AccountNumber } from '../../../../account/domain/value-objects/account-number.vo';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../../shared/domain/exception/application.exception';
import { Money } from '../../../../../shared/domain/money.vo';
import { UserId } from '../../../../identity/domain/value-object/user-id.vo';

@CommandHandler(TransferCommand)
export class TransferCommandHandler implements ICommandHandler<
  TransferCommand,
  Transfer
> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: AccountRepositoryPort,
    @Inject(TRANSFER_REPOSITORY)
    private readonly transferRepo: TransferRepositoryPort,
  ) {}

  async execute(command: TransferCommand): Promise<Transfer> {
    const initiatedBy = UserId.fromString(command.userId);

    const fromAccountNo = AccountNumber.fromString(command.fromAccountNumber);
    const toAccountNo = AccountNumber.fromString(command.toAccountNumber);

    const amount = Money.fromRupee(command.ammount, 'INR');

    const fromAcc = await this.accountRepo.findByNumber(fromAccountNo);
    const toAcc = await this.accountRepo.findByNumber(toAccountNo);

    if (!fromAcc || !toAcc) {
      throw new ApplicationException(
        'Account not found',
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    if (!initiatedBy.equals(fromAcc?.userId)) {
      throw new ApplicationException(
        'Your are unauthorized to perform this action',
        ApplicationExceptionCode.UNAUTHORIZED,
      );
    }

    const isValidAmount = fromAcc.balance.isGreaterThanOrEqual(amount);

    if (!isValidAmount) throw new ApplicationException('Low Balance');

    const transfer = Transfer.start(
      initiatedBy,
      fromAcc.id,
      toAcc.id,
      amount,
      command.idempotencyKey,
    );

    const pendingTransaction = await this.transferRepo.create(transfer);

    return pendingTransaction;
  }
}
