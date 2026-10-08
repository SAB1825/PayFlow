import { PostgresHealthCheck } from './postgres-health.check';
import type { DrizzleDatabase } from '../../../shared/infrastructure/database/drizzle.types';

describe('PostgresHealthCheck', () => {
  function makeCheck(execute: jest.Mock): PostgresHealthCheck {
    return new PostgresHealthCheck({ execute } as unknown as DrizzleDatabase);
  }

  it('passes when the probe query succeeds', async () => {
    const check = makeCheck(jest.fn().mockResolvedValue([{ '?column?': 1 }]));

    await expect(check.run()).resolves.toBeUndefined();
    expect(check.name).toBe('postgres');
  });

  it('surfaces the driver error hidden behind drizzle`s wrapper', async () => {
    const driverError = new Error('connect ECONNREFUSED 127.0.0.1:5432');
    const wrapped = Object.assign(new Error('Failed query: select 1'), {
      cause: driverError,
    });
    const check = makeCheck(jest.fn().mockRejectedValue(wrapped));

    await expect(check.run()).rejects.toThrow('connect ECONNREFUSED');
  });

  it('expands an empty-message AggregateError into its per-address errors', async () => {
    const aggregate = new AggregateError([
      new Error('connect ECONNREFUSED ::1:5432'),
      new Error('connect ECONNREFUSED 127.0.0.1:5432'),
    ]);
    const wrapped = Object.assign(new Error('Failed query: select 1'), {
      cause: aggregate,
    });
    const check = makeCheck(jest.fn().mockRejectedValue(wrapped));

    await expect(check.run()).rejects.toThrow(
      'connect ECONNREFUSED ::1:5432; connect ECONNREFUSED 127.0.0.1:5432',
    );
  });

  it('keeps an AggregateError that already carries a message', async () => {
    const aggregate = new AggregateError([new Error('inner')], 'connect failed');
    const wrapped = Object.assign(new Error('Failed query: select 1'), {
      cause: aggregate,
    });
    const check = makeCheck(jest.fn().mockRejectedValue(wrapped));

    await expect(check.run()).rejects.toThrow('connect failed');
  });

  it('rethrows the original error when there is no cause', async () => {
    const check = makeCheck(jest.fn().mockRejectedValue(new Error('pool closed')));

    await expect(check.run()).rejects.toThrow('pool closed');
  });
});
