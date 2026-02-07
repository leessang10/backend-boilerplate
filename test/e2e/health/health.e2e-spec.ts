import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from '../support/create-test-app';

describe('Health Smoke (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /v1/health/live should return liveness payload', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health/live')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
    });
    expect(response.body).toHaveProperty('timestamp');
  });
});
