import {
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { TransferCommand } from './transfer.command';
import {
  Transfer,
  TransferStatus,
} from '../../../domain/entities/transfer.entity';
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
    private readonly eventBus: EventBus,
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

    // Constructing the aggregate validates the idempotency key, the amount and
    // the from/to pair before we touch any state.
    const transfer = Transfer.start(
      initiatedBy,
      fromAcc.id,
      toAcc.id,
      amount,
      command.idempotencyKey,
    );

    // Fast path: a previous request with this key already reached a terminal
    // state, so return that outcome without moving money again.
    const replay = await this.transferRepo.findByIdempotencyKey(
      command.idempotencyKey,
    );
    if (replay) return this.returnIfOwner(replay, initiatedBy);

    try {
      // Locking both accounts, moving the money and persisting the transfer all
      // happen in a single transaction. The row is therefore only ever
      // committed as SUCCESS and can never be left stranded in PENDING: if the
      // process dies or the transaction rolls back, no row exists at all and a
      // retry with the same idempotency key can run cleanly.
      const completed = await this.unitOfWork.runInTransaction(async (tx) => {
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

        transfer.markSuccess();
        return this.transferRepo.create(transfer, tx);
      });

      // Events are only announced after the transaction committed, so
      // consumers never see an event for a transfer the DB rolled back.
      this.publishDomainEvents(transfer);

      return completed;
    } catch (err) {
      if (isIdempotencyConflict(err)) {
        // A concurrent request with the same key won the race. Its committed
        // outcome is authoritative; our attempt was rolled back.
        const original = await this.transferRepo.findByIdempotencyKey(
          command.idempotencyKey,
        );
        if (original) return this.returnIfOwner(original, initiatedBy);
        throw err;
      }

      // Record the failed attempt so it is queryable and replayable. This is
      // only safe while the aggregate is still PENDING: if markSuccess already
      // ran, the commit outcome is ambiguous and writing a row would be wrong.
      if (transfer.status === TransferStatus.Pending) {
        await this.recordFailure(transfer, err);
      }
      throw err;
    }
  }

  /**
   * The transaction has already rolled back, so balances are untouched. We
   * persist the FAILED transfer in its own transaction (best effort) so a
   * crash mid-way cannot strand a PENDING row.
   */
  private async recordFailure(transfer: Transfer, error: unknown): Promise<void> {
    transfer.markFailed(
      error instanceof Error ? error.message : 'Unknown error',
    );

    try {
      await this.transferRepo.create(transfer);
    } catch (persistError) {
      // A concurrent attempt may already own the idempotency key; its result is
      // authoritative. Any other bookkeeping error must not replace the real
      // transfer failure reported to the caller.
      if (isIdempotencyConflict(persistError)) return;
    }

    this.publishDomainEvents(transfer);
  }

  /**
   * The aggregate recorded its domain events when the state changed
   * (markSuccess/markFailed); they are only put on the CQRS bus once the
   * new status is safely persisted, so consumers never see an event for a
   * transfer the DB rolled back.
   */
  private publishDomainEvents(transfer: Transfer): void {
    for (const event of transfer.pullDomainEvents()) {
      this.eventBus.publish(event);
    }
  }

  private returnIfOwner(transfer: Transfer, userId: UserId): Transfer {
    if (!transfer.initiatedBy.equals(userId)) {
      throw new ApplicationException(
        'Idempotency key already used',
        ApplicationExceptionCode.CONFLICT,
      );
    }

    // Only a terminal transfer is a valid idempotent response. A PENDING row
    // means an earlier attempt never finished; returning it as if it were the
    // completed result would report a transfer that will never settle.
    if (transfer.status === TransferStatus.Pending) {
      throw new ApplicationException(
        'A transfer with this idempotency key is still being processed',
        ApplicationExceptionCode.CONFLICT,
      );
    }

    return transfer;
  }
}

function isIdempotencyConflict(error: unknown): boolean {
  return (
    error instanceof ApplicationException &&
    error.code === ApplicationExceptionCode.CONFLICT
  );
}
