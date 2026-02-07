import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from '../support/create-test-app';

describe('User Smoke (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /api/v1/users/me should require authentication', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });
});
