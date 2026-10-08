import { Module } from '@nestjs/common';
import { HEALTH_CHECKS, type HealthCheck } from './application/ports/health-check.port';
import { HealthCheckerService } from './application/health-checker.service';
import { PostgresHealthCheck } from './infrastructure/postgres-health.check';
import { HealthController } from './presentation/health.controller';

/**
 * Liveness/readiness endpoints. Additional dependencies (queues, caches, ...)
 * join the report by writing a `HealthCheck` implementation and listing it
 * in the `HEALTH_CHECKS` factory below.
 */
@Module({
  controllers: [HealthController],
  providers: [
    HealthCheckerService,
    PostgresHealthCheck,
    {
      provide: HEALTH_CHECKS,
      useFactory: (postgres: PostgresHealthCheck): HealthCheck[] => [postgres],
      inject: [PostgresHealthCheck],
    },
  ],
})
export class HealthModule {}
