
import { randomUUID } from 'node:crypto';

export class UniqueId {
  private readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  static create(): UniqueId {
    return new UniqueId(randomUUID());
  }

  static fromString(value: string): UniqueId {
    return new UniqueId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UniqueId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
