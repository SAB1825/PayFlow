import { randomUUID } from 'node:crypto';

export class UniqueId {
  private readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  // Both factories are polymorphic: `UserId.fromString(...)` must yield a
  // `UserId`, not a bare `UniqueId`. Hardcoding `new UniqueId(...)` here made
  // every subclass silently degrade to the base type at runtime.
  static create<T extends UniqueId>(this: new (value: string) => T): T {
    return new this(randomUUID());
  }

  static fromString<T extends UniqueId>(
    this: new (value: string) => T,
    value: string,
  ): T {
    return new this(value);
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
