import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from '../support/create-test-app';

describe('Metrics Smoke (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /v1/metrics/info should return metrics metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/metrics/info')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('metrics');
    expect(response.body.metrics).toHaveProperty('httpRequests');
  });
});
