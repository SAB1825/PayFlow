import { randomUUID } from 'node:crypto';

export class UserId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(): UserId {
    return new UserId(randomUUID());
  }

  static fromString(value: string): UserId {
    return new UserId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}