import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { DomainException } from '../../../../shared/domain/exception/domain.exception';
import { Money } from '../../../../shared/domain/money.vo';
import { AccountId } from '../../../account/domain/value-objects/account-id.vo';
import { UserId } from '../../../identity/domain/value-object/user-id.vo';
import { TransferId } from '../value-objects/transfer-id.vo';

export enum TransferStatus {
  Pending = 'PENDING',
  Success = 'SUCCESS',
  Failed = 'FAILED',
}

interface TransferProps {
  id: TransferId;
  initiatedBy: UserId;
  fromAccId: AccountId;
  toAccId: AccountId;
  amount: Money;
  status: TransferStatus;
  failureReason: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Transfer extends AggregateRoot {
  private _id: TransferId;
  private _initiatedBy: UserId;
  private _fromAccId: AccountId;
  private _toAccId: AccountId;
  private _ammount: Money;
  private _status: TransferStatus;
  private _failureReason: string | null;
  private _idempotencyKey: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TransferProps) {
    super();
    this._id = props.id;
    this._initiatedBy = props.initiatedBy;
    this._fromAccId = props.fromAccId;
    this._toAccId = props.toAccId;
    this._ammount = props.amount;
    this._status = props.status;
    this._failureReason = props.failureReason;
    this._idempotencyKey = props.idempotencyKey;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static start(
    initiatedBy: UserId,
    fromAccId: AccountId,
    toAccId: AccountId,
    amount: Money,
    idempotencyKey: string,
  ): Transfer {
    if (fromAccId.equals(toAccId)) {
      throw new DomainException('Cannot transfer to the same account');
    }
    if (amount.isZero()) {
      throw new DomainException('Transfer amount must be greater than zero');
    }

    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new DomainException('Idempotency key is required');
    }
    const transfer = new Transfer({
      id: TransferId.create(),
      initiatedBy,
      fromAccId,
      toAccId,
      status: TransferStatus.Pending,
      amount,
      failureReason: null,
      idempotencyKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return transfer;
  }

  markSuccess(): void {
    if (this._status !== TransferStatus.Pending) {
      throw new DomainException(
        `Cannot complete a transfer in ${this._status} state`,
      );
    }
    this._status = TransferStatus.Success;
    this._updatedAt = new Date();
  }

  markFailed(reason: string): void {
    if (this._status !== TransferStatus.Pending) {
      throw new DomainException(
        `Cannot fail a transfer in ${this._status} state`,
      );
    }
    this._status = TransferStatus.Failed;
    this._failureReason = reason;
    this._updatedAt = new Date();
  }

  get id(): TransferId {
    return this._id;
  }
  get initiatedBy(): UserId {
    return this._initiatedBy;
  }
  get fromAccountId(): AccountId {
    return this._fromAccId;
  }
  get toAccountId(): AccountId {
    return this._toAccId;
  }
  get amount(): Money {
    return this._ammount;
  }
  get status(): TransferStatus {
    return this._status;
  }
  get failureReason(): string | null {
    return this._failureReason;
  }
  get idempetencyKey(): string | null {
    return this._idempotencyKey;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
