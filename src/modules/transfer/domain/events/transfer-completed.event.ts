import { AccountId } from '../../../account/domain/value-objects/account-id.vo';
import { Money } from '../../../../shared/domain/money.vo';
import { TransferId } from '../value-objects/transfer-id.vo';
import type { DomainEvent } from '../../../../shared/domain/domain-event';

export class TransferCompletedEvent implements DomainEvent {
  readonly occurredAt: Date = new Date();

  constructor(
    public readonly transferId: TransferId,
    public readonly fromAccountId: AccountId,
    public readonly toAccountId: AccountId,
    public readonly amount: Money,
  ) { }
}
