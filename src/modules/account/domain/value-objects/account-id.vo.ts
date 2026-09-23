import { randomUUID } from 'node:crypto';

export class AccountId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(): AccountId {
    return new AccountId(randomUUID());
  }

  static fromString(value: string): AccountId {
    return new AccountId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AccountId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
