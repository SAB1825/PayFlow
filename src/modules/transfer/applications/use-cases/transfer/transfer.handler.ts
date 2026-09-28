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
import {
  UNIT_OF_WORK,
  type UnitOfWorkPort,
} from '../../../../../shared/application/unit-of-work.port';

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
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWorkPort,
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

    try {
      await this.transferRepo.create(transfer);
    } catch (err) {
      if (
        err instanceof ApplicationException &&
        err.code === ApplicationExceptionCode.CONFLICT
      ) {
        const original = await this.transferRepo.findByIdempotencyKey(
          command.idempotencyKey,
        );
        if (original) return this.returnIfOwner(original, initiatedBy);
      }
      throw err;
    }

    try {
      await this.unitOfWork.runInTransaction(async (tx) => {
        const locked = await this.accountRepo.lockForUpdate(
          [fromAcc.id, toAcc.id],
          tx,
        );

        const from = locked.find((a) => a.id.equals(fromAcc.id));
        const to = locked.find((a) => a.id.equals(toAcc.id));

        if (!from || !to) {
          throw new ApplicationException(
            'Account not found',
            ApplicationExceptionCode.NOT_FOUND,
          );
        }

        from.withdraw(amount);
        to.deposit(amount);

        await this.accountRepo.updateBalance(from, tx);
        await this.accountRepo.updateBalance(to, tx);
      });
    } catch (err) {
      // Transaction rolled back: balances untouched. Record the failure.
      transfer.markFailed(err instanceof Error ? err.message : 'Unknown error');
      await this.transferRepo.updateStatus(transfer);
      throw err;
    }

    transfer.markSuccess();
    return this.transferRepo.updateStatus(transfer);
  }
  private returnIfOwner(transfer: Transfer, userId: UserId): Transfer {
    if (!transfer.initiatedBy.equals(userId)) {
      throw new ApplicationException(
        'Idempotency key already used',
        ApplicationExceptionCode.CONFLICT,
      );
    }
    return transfer;
  }
}
