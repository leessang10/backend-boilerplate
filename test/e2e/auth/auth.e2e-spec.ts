import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from '../support/create-test-app';

describe('Auth Smoke (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('POST /api/v1/auth/login should validate malformed payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'invalid-email',
        password: 'short',
      })
      .expect(400);
  });
});
