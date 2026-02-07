import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@prisma/client';

describe('User (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let createdUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    // Login as admin
    const adminResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!',
      });
    adminToken = adminResponse.body.data.accessToken;

    // Login as regular user
    const userResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'User123!',
      });
    userToken = userResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup created users
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
    await app.close();
  });

  describe('/v1/users/me (GET)', () => {
    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', 'user@example.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/v1/users/me').expect(401);
    });
  });

  describe('/v1/users (GET)', () => {
    it('should get all users as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
    });

    it('should fail as regular user', async () => {
      await request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.meta.limit).toBe(5);
      expect(response.body.meta.page).toBe(1);
    });

    it('should support search', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(
        response.body.data.some((user: any) => user.email.includes('admin')),
      ).toBe(true);
    });
  });

  describe('/v1/users (POST)', () => {
    it('should create a new user as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'NewUser123!',
          firstName: 'New',
          lastName: 'User',
          role: Role.USER,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', 'newuser@example.com');

      createdUserId = response.body.data.id;
    });

    it('should fail with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'admin@example.com',
          password: 'Password123!',
          role: Role.USER,
        })
        .expect(409);
    });

    it('should fail with weak password', async () => {
      await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@example.com',
          password: 'weak',
          role: Role.USER,
        })
        .expect(400);
    });

    it('should fail as regular user', async () => {
      await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'test2@example.com',
          password: 'Password123!',
          role: Role.USER,
        })
        .expect(403);
    });
  });

  describe('/v1/users/:id (PATCH)', () => {
    it('should update user as admin', async () => {
      if (!createdUserId) {
        // Create a user first
        const createResponse = await request(app.getHttpServer())
          .post('/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'updatetest@example.com',
            password: 'UpdateTest123!',
            role: Role.USER,
          });
        createdUserId = createResponse.body.data.id;
      }

      const response = await request(app.getHttpServer())
        .patch(`/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200);

      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
    });

    it('should fail with non-existent user', async () => {
      await request(app.getHttpServer())
        .patch('/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
        })
        .expect(404);
    });
  });

  describe('/v1/users/:id (DELETE)', () => {
    it('should delete user as admin', async () => {
      if (!createdUserId) {
        // Create a user first
        const createResponse = await request(app.getHttpServer())
          .post('/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'deletetest@example.com',
            password: 'DeleteTest123!',
            role: Role.USER,
          });
        createdUserId = createResponse.body.data.id;
      }

      await request(app.getHttpServer())
        .delete(`/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // User should no longer exist
      await request(app.getHttpServer())
        .get(`/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      createdUserId = null;
    });
  });
});
