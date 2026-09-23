// modules/account/domain/value-object/account-number.vo.ts
import { DomainException } from '../../../../shared/domain/exception/domain.exception';

export class AccountNumber {
  private static readonly LENGTH = 20;

  private constructor(private readonly _value: string) {}

  static generate(): AccountNumber {
    const digits = Array.from({ length: AccountNumber.LENGTH }, () =>
      Math.floor(Math.random() * 10),
    ).join('');
    return new AccountNumber(digits);
  }

  static fromString(value: string): AccountNumber {
    AccountNumber.validate(value);
    return new AccountNumber(value);
  }

  private static validate(value: string): void {
    if (!/^\d{20}$/.test(value)) {
      throw new DomainException(
        `Account number must be exactly ${AccountNumber.LENGTH} digits`,
      );
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: AccountNumber): boolean {
    return this._value === other.value;
  }

  toString(): string {
    return this._value;
  }
}
