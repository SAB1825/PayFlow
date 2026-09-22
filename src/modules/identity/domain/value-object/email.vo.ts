import { DomainException } from '../../../../shared/domain/exception/domain.exception';

export class Email {
  private readonly value: string;
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(raw: string) {
    const normalizedEmail = Email.normalizeEmail(raw);

    if (!Email.valid(normalizedEmail)) {
      throw new DomainException("Invalid Email");
    }

    this.value = normalizedEmail;
  }

  private static normalizeEmail(raw: string): string {
    return raw.trim().toLowerCase();
  }

  private static valid(email: string): boolean {
    return Email.PATTERN.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
