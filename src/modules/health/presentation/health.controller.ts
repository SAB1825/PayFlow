import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { HealthCheckerService } from '../application/health-checker.service';
import { Public } from '../../../shared/infrastructure/decorators/public.decorator';
import {
  LivenessResponseDto,
  ReadinessResponseDto,
} from './dtos/health-response.dto';

/**
 * Probe endpoints for orchestrators and load balancers.
 *
 * Marked `@Public()` (no auth) and `@SkipThrottle()` so frequent probe
 * traffic can never be rejected with 401/429.
 *
 * - `GET /health/live`  — liveness: 200 while the process serves HTTP.
 * - `GET /health/ready` — readiness: 200 when all dependencies are up, 503 otherwise.
 * - `GET /health`       — alias of `/health/ready` for LB defaults.
 */
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthChecker: HealthCheckerService) {}

  @Get('live')
  liveness(): LivenessResponseDto {
    const dto = new LivenessResponseDto();
    dto.status = 'ok';
    dto.timestamp = new Date().toISOString();
    dto.uptimeSeconds = Math.round(process.uptime());
    return dto;
  }

  @Get('ready')
  async readiness(@Res({ passthrough: true }) res: Response): Promise<ReadinessResponseDto> {
    const checks = await this.healthChecker.runChecks();
    const ready = checks.every((check) => check.status === 'up');

    const dto = new ReadinessResponseDto();
    dto.status = ready ? 'ok' : 'error';
    dto.timestamp = new Date().toISOString();
    dto.checks = checks;
    res.status(ready ? 200 : 503);
    return dto;
  }

  @Get()
  aggregate(@Res({ passthrough: true }) res: Response): Promise<ReadinessResponseDto> {
    return this.readiness(res);
  }
}
