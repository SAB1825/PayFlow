import {
  HealthCheckerService,
  HEALTH_CHECK_TIMEOUT_MS,
} from './health-checker.service';
import type { HealthCheck } from './ports/health-check.port';
import type { AppLogger } from '../../../shared/infrastructure/logging/app-logger.service';

describe('HealthCheckerService', () => {
  const logger = {
    child: () => logger,
    warn: jest.fn(),
  } as unknown as AppLogger;

  function check(name: string, run: () => Promise<void>): HealthCheck {
    return { name, run };
  }

  it('reports every check as up when they resolve', async () => {
    const service = new HealthCheckerService(
      [
        check('postgres', async () => undefined),
        check('redis', async () => undefined),
      ],
      logger,
    );

    const results = await service.runChecks();

    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.status).toBe('up');
      expect(result.error).toBeUndefined();
      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
    }
    await expect(service.isReady()).resolves.toBe(true);
  });

  it('reports a failing check as down with its error, leaving others up', async () => {
    const service = new HealthCheckerService(
      [
        check('postgres', async () => undefined),
        check('redis', async () => {
          throw new Error('connection refused');
        }),
      ],
      logger,
    );

    const results = await service.runChecks();

    expect(results.find((r) => r.name === 'postgres')?.status).toBe('up');
    const redis = results.find((r) => r.name === 'redis');
    expect(redis?.status).toBe('down');
    expect(redis?.error).toBe('connection refused');
    await expect(service.isReady()).resolves.toBe(false);
  });

  it('stringifies non-Error rejections', async () => {
    const service = new HealthCheckerService(
      [
        check('postgres', async () => {
          throw 'boom';
        }),
      ],
      logger,
    );

    const [result] = await service.runChecks();

    expect(result.status).toBe('down');
    expect(result.error).toBe('boom');
  });

  it('reports a check that exceeds the timeout as down', async () => {
    jest.useFakeTimers();
    try {
      const hanging = check('postgres', () => new Promise<void>(() => undefined));
      const service = new HealthCheckerService([hanging], logger);

      const pending = service.runChecks();
      await jest.advanceTimersByTimeAsync(HEALTH_CHECK_TIMEOUT_MS);
      const [result] = await pending;

      expect(result.status).toBe('down');
      expect(result.error).toContain('timed out');
    } finally {
      jest.useRealTimers();
    }
  });

  it('succeeds when the dependency resolves just under the timeout', async () => {
    jest.useFakeTimers();
    try {
      const slow = check(
        'postgres',
        () =>
          new Promise<void>((resolve) => {
            setTimeout(resolve, HEALTH_CHECK_TIMEOUT_MS - 1);
          }),
      );
      const service = new HealthCheckerService([slow], logger);

      const pending = service.runChecks();
      await jest.advanceTimersByTimeAsync(HEALTH_CHECK_TIMEOUT_MS - 1);
      const [result] = await pending;

      expect(result.status).toBe('up');
    } finally {
      jest.useRealTimers();
    }
  });
});
