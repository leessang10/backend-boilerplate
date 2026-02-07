import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/health (GET)', () => {
    it('should return health check status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('info');
    });
  });

  describe('/v1/health/ready (GET)', () => {
    it('should return readiness probe status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('/v1/health/live (GET)', () => {
    it('should return liveness probe status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });
});
