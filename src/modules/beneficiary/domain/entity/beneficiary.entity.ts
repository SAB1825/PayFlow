import { AccountNumber } from '../../../account/domain/value-objects/account-number.vo';
import { UserId } from '../../../identity/domain/value-object/user-id.vo';
import { BeneficiaryId } from '../value-objects/beneficiary-id.vo';

export enum BeneficiaryStatus {
  ACTIVE = 'ACTIVE',
  REMOVED = 'REMOVED',
}

interface BeneficiaryProps {
  id: BeneficiaryId;
  ownerUserId: UserId;
  accountNumber: AccountNumber;
  nickname: string;
  status: BeneficiaryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Beneficiary {
  private _id: BeneficiaryId;
  private _ownerUserId: UserId;
  private _accountNumber: AccountNumber;
  private _nickname: string;
  private _status: BeneficiaryStatus;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: BeneficiaryProps) {
    this._id = props.id;
    this._ownerUserId = props.ownerUserId;
    this._accountNumber = props.accountNumber;
    this._nickname = props.nickname;
    this._status = props.status;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(
    ownerUserId: UserId,
    accountNumber: AccountNumber,
    nickname: string,
  ): Beneficiary {
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      throw new Error('Beneficiary nickname is required');
    }

    if (trimmedNickname.length > 50) {
      throw new Error(
        'Beneficiary nickname cannot exceed 50 characters',
      );
    }

    return new Beneficiary({
      id: BeneficiaryId.create(),
      ownerUserId,
      accountNumber,
      nickname: trimmedNickname,
      status: BeneficiaryStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  static reconstitute(
    props: BeneficiaryProps,
  ): Beneficiary {
    return new Beneficiary(props);
  }

  remove(): void {
    this._status = BeneficiaryStatus.REMOVED;
  }

  activate(): void {
    this._status = BeneficiaryStatus.ACTIVE;
  }

  get id(): BeneficiaryId {
    return this._id;
  }

  get ownerUserId(): UserId {
    return this._ownerUserId;
  }

  get accountNumber(): AccountNumber {
    return this._accountNumber;
  }

  get nickname(): string {
    return this._nickname;
  }

  get status(): BeneficiaryStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
