import { TransferCompletedHandler } from './transfer-notification.handler';
import { TransferCompletedEvent } from '../../../transfer/domain/events/transfer-completed.event';
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

describe('TransferCompletedHandler', () => {
  const senderUserId = '11111111-1111-1111-1111-111111111111';
  const receiverUserId = '22222222-2222-2222-2222-222222222222';

  const fromAccount = makeAccount(senderUserId, '11111111111111111111');
  const toAccount = makeAccount(receiverUserId, '22222222222222222222');

  let accountRepo: { findById: jest.Mock };
  let emitter: { emit: jest.Mock };
  let handler: TransferCompletedHandler;

  beforeEach(() => {
    accountRepo = {
      findById: jest.fn().mockImplementation(async (accountId: AccountId) =>
        accountId.equals(fromAccount.id) ? fromAccount : toAccount),
    };
    emitter = { emit: jest.fn().mockResolvedValue(undefined) };

    handler = new TransferCompletedHandler(
      accountRepo as unknown as AccountRepositoryPort,
      emitter as unknown as NotificationEmitter,
    );
  });

  function makeEvent(): TransferCompletedEvent {
    return new TransferCompletedEvent(
      TransferId.create(),
      fromAccount.id,
      toAccount.id,
      Money.fromRupee(250, 'INR'),
    );
  }

  it('notifies both the sender and the receiver', async () => {
    await handler.handle(makeEvent());

    expect(emitter.emit).toHaveBeenCalledTimes(2);

    const [sent, received] = emitter.emit.mock.calls;

    expect(sent[0].getValue()).toBe(senderUserId);
    expect(sent[1]).toBe(NotificationType.TransferSent);
    expect(sent[2]).toBe('Transfer sent');
    expect(sent[3]).toBe('₹250 sent to 22222222222222222222');

    expect(received[0].getValue()).toBe(receiverUserId);
    expect(received[1]).toBe(NotificationType.TransferReceived);
    expect(received[2]).toBe('Money received');
    expect(received[3]).toBe('₹250 received from 11111111111111111111');
  });

  it('notifies nobody when an account can no longer be found', async () => {
    accountRepo.findById.mockResolvedValue(null);

    await expect(handler.handle(makeEvent())).rejects.toThrow(ApplicationException);
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
