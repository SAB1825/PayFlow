import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { setupHttpApp } from '../src/app.setup';

/**
 * Guards the *shape* of the HTTP surface: the versioned prefix, the health
 * probe exclusion, and the global validation/auth wiring. `setupHttpApp` is
 * the same function `main.ts` runs, so these assertions hold for the server
 * that actually ships.
 */
describe('HTTP route surface (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupHttpApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves business routes behind /api/v1', async () => {
    // Auth guard answers instead of 404 => the route exists under the prefix.
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    // The unversioned path must be gone.
    await request(app.getHttpServer()).get('/auth/me').expect(404);
  });

  it('keeps health probes at the root', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200);
    await request(app.getHttpServer()).get('/api/v1/health/live').expect(404);
  });

  it('rejects invalid bodies through the global validation pipe', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({})
      .expect(400);
  });
});
