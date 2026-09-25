import { randomUUID } from 'node:crypto';

export class TransferId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(): TransferId {
    return new TransferId(randomUUID());
  }

  static fromString(value: string): TransferId {
    return new TransferId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TransferId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
