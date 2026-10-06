import { TransferFailedHandler } from './transfer-failed-notification.handler';
import { TransferFailedEvent } from '../../../transfer/domain/events/transfer-failed.event';
import { Account, AccountStatus, AccountType } from '../../../account/domain/entities/account.entity';
import { AccountId } from '../../../account/domain/value-objects/account-id.vo';
import { AccountNumber } from '../../../account/domain/value-objects/account-number.vo';
import { UserId } from '../../../identity/domain/value-object/user-id.vo';
import { TransferId } from '../../../transfer/domain/value-objects/transfer-id.vo';
import { Money } from '../../../../shared/domain/money.vo';
import { NotificationType } from '../../domain/entity/notification.entity';
import { ApplicationException } from '../../../../shared/domain/exception/application.exception';
import type { AccountRepositoryPort } from '../../../account/applications/ports/account-repository.port';
import type { NotificationEmitter } from './notification-emitter';

describe('TransferFailedHandler', () => {
  const senderUserId = '11111111-1111-1111-1111-111111111111';
  const receiverUserId = '22222222-2222-2222-2222-222222222222';

  const fromAccount = makeAccount(senderUserId, '11111111111111111111');
  const toAccount = makeAccount(receiverUserId, '22222222222222222222');

  let accountRepo: { findById: jest.Mock };
  let emitter: { emit: jest.Mock };
  let handler: TransferFailedHandler;

  beforeEach(() => {
    accountRepo = {
      findById: jest.fn().mockImplementation(async (accountId: AccountId) =>
        accountId.equals(fromAccount.id) ? fromAccount : toAccount),
    };
    emitter = { emit: jest.fn().mockResolvedValue(undefined) };

    handler = new TransferFailedHandler(
      accountRepo as unknown as AccountRepositoryPort,
      emitter as unknown as NotificationEmitter,
    );
  });

  function makeEvent(reason: string): TransferFailedEvent {
    return new TransferFailedEvent(
      TransferId.create(),
      fromAccount.id,
      toAccount.id,
      Money.fromRupee(100, 'INR'),
      reason,
    );
  }

  it('notifies only the sender, with the reason', async () => {
    await handler.handle(makeEvent('Low Balance'));

    expect(emitter.emit).toHaveBeenCalledTimes(1);

    const [userId, type, title, message] = emitter.emit.mock.calls[0];
    expect(userId.getValue()).toBe(senderUserId);
    expect(type).toBe(NotificationType.TransferFailed);
    expect(title).toBe('Transfer failed');
    expect(message).toBe('₹100 transfer to 22222222222222222222 failed: Low Balance');
  });

  it('keeps the message inside the 500 char column limit', async () => {
    await handler.handle(makeEvent('x'.repeat(1000)));

    const [, , , message] = emitter.emit.mock.calls[0];
    expect(message.length).toBeLessThanOrEqual(500);
  });

  it('notifies nobody when the sender account no longer exists', async () => {
    accountRepo.findById.mockResolvedValue(null);

    await expect(handler.handle(makeEvent('boom'))).rejects.toThrow(ApplicationException);
    expect(emitter.emit).not.toHaveBeenCalled();
  });
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
