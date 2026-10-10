import { TransferCommandHandler } from './transfer.handler';
import { TransferCommand } from './transfer.command';
import { Transfer, TransferStatus } from '../../../domain/entities/transfer.entity';
import { Account, AccountStatus, AccountType } from '../../../../account/domain/entities/account.entity';
import { AccountId } from '../../../../account/domain/value-objects/account-id.vo';
import { AccountNumber } from '../../../../account/domain/value-objects/account-number.vo';
import { UserId } from '../../../../identity/domain/value-object/user-id.vo';
import { Money } from '../../../../../shared/domain/money.vo';
import { ApplicationException, ApplicationExceptionCode } from '../../../../../shared/domain/exception/application.exception';
import { TransferCompletedEvent } from '../../../domain/events/transfer-completed.event';
import { TransferFailedEvent } from '../../../domain/events/transfer-failed.event';
import { EventBus } from '@nestjs/cqrs';
import type { AccountRepositoryPort } from '../../../../account/applications/ports/account-repository.port';
import type { TransferRepositoryPort } from '../../ports/transfer.repository.port';
import type { UnitOfWorkPort } from '../../../../../shared/application/unit-of-work.port';

describe('TransferCommandHandler event publishing', () => {
  const senderUserId = '11111111-1111-1111-1111-111111111111';

  let fromAccount: Account;
  let toAccount: Account;

  let accountRepo: { findByNumber: jest.Mock; lockForUpdate: jest.Mock; updateBalance: jest.Mock };
  let transferRepo: { create: jest.Mock; findByIdempotencyKey: jest.Mock };
  let unitOfWork: { runInTransaction: jest.Mock };
  let eventBus: { publish: jest.Mock };
  let handler: TransferCommandHandler;

  beforeEach(() => {
    // Fresh accounts per test: `withdraw`/`deposit` mutate the objects, so
    // sharing them across tests would leak balances between cases.
    fromAccount = makeAccount(senderUserId, '11111111111111111111');
    toAccount = makeAccount('22222222-2222-2222-2222-222222222222', '22222222222222222222');

    accountRepo = {
      findByNumber: jest.fn().mockImplementation(async (number: AccountNumber) =>
        number.equals(fromAccount.accountNumber) ? fromAccount : toAccount),
      lockForUpdate: jest.fn().mockResolvedValue([fromAccount, toAccount]),
      updateBalance: jest.fn().mockResolvedValue(undefined),
    };
    transferRepo = {
      create: jest.fn().mockImplementation(async (transfer: Transfer) => transfer),
      findByIdempotencyKey: jest.fn().mockResolvedValue(null),
    };
    unitOfWork = {
      runInTransaction: jest.fn().mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => work({})),
    };
    eventBus = { publish: jest.fn() };

    handler = new TransferCommandHandler(
      accountRepo as unknown as AccountRepositoryPort,
      transferRepo as unknown as TransferRepositoryPort,
      unitOfWork as unknown as UnitOfWorkPort,
      eventBus as unknown as EventBus,
    );
  });

  function makeCommand(): TransferCommand {
    return new TransferCommand(
      senderUserId,
      '11111111111111111111',
      '22222222222222222222',
      'idem-1',
      100,
    );
  }

  it('publishes TransferCompletedEvent once the money has moved', async () => {
    const transfer = await handler.execute(makeCommand());

    expect(transfer.status).toBe(TransferStatus.Success);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);

    const published = eventBus.publish.mock.calls[0][0];
    expect(published).toBeInstanceOf(TransferCompletedEvent);
    expect(published.amount.toRupee()).toBe(100);
    expect(published.fromAccountId.equals(fromAccount.id)).toBe(true);
    expect(published.toAccountId.equals(toAccount.id)).toBe(true);

    // The transfer must be persisted through the active transaction, not on
    // the shared connection: that is what makes the write atomic with the
    // balance move and leaves no room for a stranded PENDING row.
    expect(transferRepo.create).toHaveBeenCalledWith(
      expect.any(Transfer),
      expect.anything(),
    );
  });

  it('publishes TransferFailedEvent when the balance update rolls back', async () => {
    unitOfWork.runInTransaction.mockRejectedValue(new Error('deadlock'));

    await expect(handler.execute(makeCommand())).rejects.toThrow('deadlock');

    expect(eventBus.publish).toHaveBeenCalledTimes(1);

    const published = eventBus.publish.mock.calls[0][0];
    expect(published).toBeInstanceOf(TransferFailedEvent);
    expect(published.reason).toBe('deadlock');
    expect(published.amount.toRupee()).toBe(100);
  });

  it('returns the original transfer without side effects when a terminal request is replayed', async () => {
    const original = makeTransfer();
    original.markSuccess();
    transferRepo.findByIdempotencyKey.mockResolvedValue(original);

    const transfer = await handler.execute(makeCommand());

    expect(transfer).toBe(original);
    expect(transfer.status).toBe(TransferStatus.Success);
    expect(transferRepo.create).not.toHaveBeenCalled();
    expect(unitOfWork.runInTransaction).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('rejects a replay while the original attempt is still PENDING', async () => {
    const stranded = makeTransfer();
    transferRepo.findByIdempotencyKey.mockResolvedValue(stranded);

    await expect(handler.execute(makeCommand())).rejects.toMatchObject({
      code: ApplicationExceptionCode.CONFLICT,
    });

    expect(transferRepo.create).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('returns the winning transfer when a concurrent request grabs the idempotency key first', async () => {
    const winner = makeTransfer();
    winner.markSuccess();

    // Pre-check misses, then the in-transaction insert hits the unique
    // constraint because the concurrent request already committed.
    transferRepo.findByIdempotencyKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winner);
    transferRepo.create.mockRejectedValue(
      new ApplicationException('Duplicate transfer request', ApplicationExceptionCode.CONFLICT),
    );

    const transfer = await handler.execute(makeCommand());

    expect(transfer).toBe(winner);
    expect(transfer.status).toBe(TransferStatus.Success);
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  function makeTransfer(): Transfer {
    return Transfer.start(
      fromAccount.userId,
      fromAccount.id,
      toAccount.id,
      Money.fromRupee(100, 'INR'),
      'idem-1',
    );
  }
});

function makeAccount(userId: string, accountNumber: string): Account {
  return Account.reconstitute({
    id: AccountId.create(),
    userId: UserId.fromString(userId),
    accountNumber: AccountNumber.fromString(accountNumber),
    accountType: AccountType.Savings,
    balance: Money.fromRupee(1000, 'INR'),
    currency: 'INR',
    status: AccountStatus.Active,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
