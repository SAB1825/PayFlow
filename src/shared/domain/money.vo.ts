import { DomainException } from './exception/domain.exception';

export class Money {
  private constructor(
    private readonly _paise: number,
    private readonly _currency: string,
  ) {}

  private static normalize(paise: number, currency: string): void {
    if (!Number.isInteger(paise) || paise < 0)
      throw new DomainException('Invalid money amount');
    if (!/^[A-Z]{3}$/.test(currency))
      throw new DomainException('Invalid currency code');
  }

  static fromPaise(paise: number, currency: string): Money {
    this.normalize(paise, currency);
    return new Money(paise, currency);
  }

  static fromRupee(rupee: number, currency: string): Money {
    const paise = Math.round(rupee * 100);
    this.normalize(paise, currency);
    return new Money(paise, currency);
  }

  toRupee(): number {
    return this._paise / 100;
  }

  get currency(): string {
    return this._currency;
  }

  get paise(): number {
    return this._paise;
  }

  static zero(currency: string): Money {
    return new Money(0, currency);
  }

  equals(other: Money): boolean {
    return this._paise === other.paise && this._currency === other.currency;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._paise >= other.paise;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._paise + other.paise, this._currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this._paise - other.paise;
    if (result < 0)
      throw new DomainException('Money is not reducible for the given amount');
    return new Money(result, this._currency);
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this._currency)
      throw new DomainException(
        "Can't operate on money from different currencies.",
      );
  }
}
