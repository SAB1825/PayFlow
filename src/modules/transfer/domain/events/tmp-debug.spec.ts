import { TransferCompletedEvent } from '../events/transfer-completed.event';
import { AccountId } from '../../../account/domain/value-objects/account-id.vo';
import { Money } from '../../../../shared/domain/money.vo';
import { TransferId } from '../value-objects/transfer-id.vo';

describe('debug', () => {
  it('inspect event construction', () => {
    const e = new TransferCompletedEvent(
      TransferId.create(),
      AccountId.create(),
      AccountId.create(),
      Money.fromRupee(100, 'INR'),
    );
    console.log('keys:', Object.keys(e));
    console.log('amount:', (e as any).amount);
    console.log('json-ish:', JSON.stringify(Object.getOwnPropertyNames(e)));
    console.log('ctor length:', TransferCompletedEvent.length);
    console.log('src:', TransferCompletedEvent.toString().slice(0, 400));
  });
});
