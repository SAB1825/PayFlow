import type { HealthCheckResult } from '../../application/ports/health-check.port';

/** Liveness probe payload: the process is up and serving HTTP. */
export class LivenessResponseDto {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

/**
 * Readiness probe payload: `ok` when every dependency check passed (HTTP 200),
 * `error` otherwise (HTTP 503).
 */
export class ReadinessResponseDto {
  status: 'ok' | 'error';
  timestamp: string;
  checks: HealthCheckResult[];
}
