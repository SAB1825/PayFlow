import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { Money } from '../../../../shared/domain/money.vo';
import { UserId } from '../../../identity/domain/value-object/user-id.vo';
import { AccountId } from '../value-objects/account-id.vo';
import { AccountNumber } from '../value-objects/account-number.vo';

export enum AccountType {
  Savings = 'SAVINGS',
  Current = 'CURRENT',
}
export enum AccountStatus {
  Active = 'ACTIVE',
  Frozen = 'FROZEN',
  Closed = 'CLOSED',
}

interface AccountProps {
  id: AccountId;
  userId: UserId;
  accountNumber: AccountNumber;
  accountType: AccountType;
  balance: Money;
  currency: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Account extends AggregateRoot {
  private _id: AccountId;
  private _userId: UserId;
  private _accountNumber: AccountNumber;
  private _accountType: AccountType;
  private _balance: Money;
  private _currency: string;
  private _status: AccountStatus;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AccountProps) {
    super();
    this._id = props.id;
    this._userId = props.userId;
    this._accountNumber = props.accountNumber;
    this._accountType = props.accountType;
    this._balance = props.balance;
    this._currency = props.currency;
    this._createdAt = props.createdAt;
    this._status = props.status;
    this._updatedAt = props.updatedAt;
  }

  static create(
    userId: UserId,
    accountType: AccountType,
    currency: string,
  ): Account {
    const accountId = AccountId.create();
    const accountNumber = AccountNumber.generate();
    const now = new Date();

    const account = new Account({
      id: accountId,
      userId,
      accountNumber,
      accountType: accountType,
      balance: Money.zero(currency),
      currency,
      status: AccountStatus.Active,
      createdAt: now,
      updatedAt: now,
    });

    return account;
  }

  static reconstitute(props: AccountProps): Account {
    return new Account(props);
  }

  get id(): AccountId {
    return this._id;
  }
  get userId(): UserId {
    return this._userId;
  }
  get accountNumber(): AccountNumber {
    return this._accountNumber;
  }
  get balance(): Money {
    return this._balance;
  }
  get status(): AccountStatus {
    return this._status;
  }
  get accountType(): AccountType {
    return this._accountType;
  }
  get currency(): string {
    return this._currency;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
