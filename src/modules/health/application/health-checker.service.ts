import { Inject, Injectable } from '@nestjs/common';
import { AppLogger } from '../../../shared/infrastructure/logging/app-logger.service';
import {
  HEALTH_CHECKS,
  type HealthCheck,
  type HealthCheckResult,
} from './ports/health-check.port';

/** A check that has not settled within this budget is reported as `down`. */
export const HEALTH_CHECK_TIMEOUT_MS = 2_000;

@Injectable()
export class HealthCheckerService {
  private readonly logger: AppLogger;

  constructor(
    @Inject(HEALTH_CHECKS) private readonly checks: HealthCheck[],
    logger: AppLogger,
  ) {
    this.logger = logger.child(HealthCheckerService.name);
  }

  /**
   * Runs every registered check in parallel and reports per-check timing.
   * Never throws: an unhealthy dependency surfaces as `status: 'down'`.
   */
  async runChecks(): Promise<HealthCheckResult[]> {
    return Promise.all(this.checks.map((check) => this.runCheck(check)));
  }

  /** `true` only when every registered check is up. */
  async isReady(): Promise<boolean> {
    const results = await this.runChecks();
    return results.every((result) => result.status === 'up');
  }

  private async runCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const startedAt = Date.now();
    try {
      await this.withTimeout(check.run(), check.name);
      return { name: check.name, status: 'up', responseTimeMs: Date.now() - startedAt };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`health check "${check.name}" is down`, { check: check.name, error: message });
      return {
        name: check.name,
        status: 'down',
        responseTimeMs: Date.now() - startedAt,
        error: message,
      };
    }
  }

  private withTimeout(work: Promise<void>, name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`${name} timed out after ${HEALTH_CHECK_TIMEOUT_MS}ms`)),
        HEALTH_CHECK_TIMEOUT_MS,
      );
      const settle = (outcome: () => void) => {
        clearTimeout(timer);
        outcome();
      };
      work.then(
        () => settle(resolve),
        (error: unknown) => settle(() => reject(error)),
      );
    });
  }
}
