import { isUniqueViolation } from './unique-violation.error';

function pgError(code: string, constraint?: string): Error {
  return Object.assign(new Error('pg error'), { code, constraint });
}

describe('isUniqueViolation', () => {
  it('detects a bare Postgres unique violation', () => {
    expect(
      isUniqueViolation(pgError('23505', 'transfers_idempotency_key_unique')),
    ).toBe(true);
  });

  it('unwraps the DrizzleQueryError cause chain', () => {
    const wrapped = Object.assign(new Error('Failed query'), {
      cause: pgError('23505', 'transfers_idempotency_key_unique'),
    });

    expect(isUniqueViolation(wrapped, 'idempotency_key')).toBe(true);
  });

  it('unwraps deeply nested causes', () => {
    const wrapped = new Error('outer', {
      cause: new Error('middle', {
        cause: pgError('23505', 'users_email_unique'),
      }),
    });

    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it('matches only the requested constraint', () => {
    const wrapped = Object.assign(new Error('Failed query'), {
      cause: pgError('23505', 'transfers_idempotency_key_unique'),
    });

    expect(isUniqueViolation(wrapped, 'idempotency_key')).toBe(true);
    expect(isUniqueViolation(wrapped, 'account_number')).toBe(false);
  });

  it('ignores other Postgres errors', () => {
    expect(isUniqueViolation(pgError('23503'))).toBe(false);
    expect(isUniqueViolation(pgError('42P01'))).toBe(false);
  });

  it('returns false for non-errors and empty values', () => {
    expect(isUniqueViolation(new Error('boom'))).toBe(false);
    expect(isUniqueViolation('23505')).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
  });
});
