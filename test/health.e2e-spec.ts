import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { HealthController } from '../src/modules/health/presentation/health.controller';
import { HealthCheckerService } from '../src/modules/health/application/health-checker.service';
import type { HealthCheckResult } from '../src/modules/health/application/ports/health-check.port';

describe('Health endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let runChecks: jest.Mock;

  const up = (name: string): HealthCheckResult => ({
    name,
    status: 'up',
    responseTimeMs: 1,
  });
  const down = (name: string, error: string): HealthCheckResult => ({
    name,
    status: 'down',
    responseTimeMs: 1,
    error,
  });

  beforeEach(async () => {
    runChecks = jest.fn();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthCheckerService, useValue: { runChecks } }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health/live returns 200 while the process is up', async () => {
    const res = await request(app.getHttpServer()).get('/health/live').expect(200);

    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptimeSeconds).toBe('number');
    expect(runChecks).not.toHaveBeenCalled();
  });

  it('GET /health/ready returns 200 when every check is up', async () => {
    runChecks.mockResolvedValue([up('postgres')]);

    const res = await request(app.getHttpServer()).get('/health/ready').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.checks).toEqual([
      { name: 'postgres', status: 'up', responseTimeMs: 1 },
    ]);
  });

  it('GET /health/ready returns 503 when a dependency is down', async () => {
    runChecks.mockResolvedValue([
      up('postgres'),
      down('postgres-replica', 'connection refused'),
    ]);

    const res = await request(app.getHttpServer()).get('/health/ready').expect(503);

    expect(res.body.status).toBe('error');
    expect(res.body.checks).toEqual([
      { name: 'postgres', status: 'up', responseTimeMs: 1 },
      { name: 'postgres-replica', status: 'down', responseTimeMs: 1, error: 'connection refused' },
    ]);
  });

  it('GET /health aliases readiness', async () => {
    runChecks.mockResolvedValue([down('postgres', 'timeout')]);

    await request(app.getHttpServer()).get('/health').expect(503);
    expect(runChecks).toHaveBeenCalledTimes(1);
  });
});
