/**
 * Token for the aggregated list of health checks.
 *
 * `HealthModule` builds it with a factory provider, so adding a dependency
 * to the readiness report means writing the check class and listing it in
 * the factory's `inject`/return array.
 */
export const HEALTH_CHECKS = Symbol('HEALTH_CHECKS');

/** A single readiness dependency (database, cache, queue, ...). */
export interface HealthCheck {
  /** Stable identifier reported in the payload, e.g. `postgres`. */
  readonly name: string;

  /** Resolves when healthy; rejects when the dependency is unavailable. */
  run(): Promise<void>;
}

/** Outcome of one registered check. */
export interface HealthCheckResult {
  name: string;
  status: 'up' | 'down';
  responseTimeMs: number;
  /** Present only when `status` is `down`. */
  error?: string;
}
