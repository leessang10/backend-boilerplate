import {
  INestApplication,
  RequestMethod,
  VERSION_NEUTRAL,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserController } from './user.controller';
import { UserService } from '../application/user.service';

describe('UserController 통합', () => {
  let app: INestApplication;
  let userService: jest.Mocked<UserService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    userService = module.get(UserService);

    app.use((req: { user?: { id: string } }, _res, next) => {
      req.user = { id: 'current-user-id' };
      next();
    });

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: VERSION_NEUTRAL,
    });

    app.setGlobalPrefix('api', {
      exclude: [
        { path: 'metrics', method: RequestMethod.ALL },
        { path: 'metrics/*path', method: RequestMethod.ALL },
      ],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('사용자 생성 요청이 유효하면 201과 생성 결과를 반환한다', async () => {
    userService.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: Role.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
        firstName: 'Test',
      })
      .expect(201);

    expect(userService.create).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123!',
      firstName: 'Test',
    });
    expect(response.body.email).toBe('user@example.com');
  });

  it('사용자 생성 요청 본문이 잘못되면 400을 반환한다', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        email: 'invalid-email',
        password: 'short',
      })
      .expect(400);

    expect(userService.create).not.toHaveBeenCalled();
  });

  it('내 프로필 조회는 현재 사용자 ID로 단건 조회를 호출한다', async () => {
    userService.findOne.mockResolvedValue({
      id: 'current-user-id',
      email: 'me@example.com',
    } as any);

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .expect(200);

    expect(userService.findOne).toHaveBeenCalledWith('current-user-id');
    expect(response.body.id).toBe('current-user-id');
  });

  it('사용자 목록 조회는 쿼리 파라미터를 변환해 전달한다', async () => {
    userService.findAll.mockResolvedValue({
      data: [],
      meta: {
        page: 2,
        limit: 5,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: true,
      },
    });

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .query({
        page: '2',
        limit: '5',
        search: 'abc',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .expect(200);

    expect(userService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 5,
        search: 'abc',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    );
  });

  it('단건 조회는 경로 파라미터 ID를 전달한다', async () => {
    userService.findOne.mockResolvedValue({
      id: 'user-2',
      email: 'user2@example.com',
    } as any);

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/user-2')
      .expect(200);

    expect(userService.findOne).toHaveBeenCalledWith('user-2');
    expect(response.body.id).toBe('user-2');
  });

  it('수정 요청 본문이 유효하면 서비스에 전달한다', async () => {
    userService.update.mockResolvedValue({
      id: 'user-2',
      firstName: 'Updated',
    } as any);

    const response = await request(app.getHttpServer())
      .patch('/api/v1/users/user-2')
      .send({
        firstName: 'Updated',
        isActive: false,
      })
      .expect(200);

    expect(userService.update).toHaveBeenCalledWith('user-2', {
      firstName: 'Updated',
      isActive: false,
    });
    expect(response.body.firstName).toBe('Updated');
  });

  it('수정 요청 본문이 잘못되면 400을 반환한다', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users/user-2')
      .send({
        role: 'INVALID_ROLE',
      })
      .expect(400);
  });

  it('삭제 요청은 204를 반환하고 삭제를 호출한다', async () => {
    userService.remove.mockResolvedValue();

    await request(app.getHttpServer())
      .delete('/api/v1/users/user-2')
      .expect(204);

    expect(userService.remove).toHaveBeenCalledWith('user-2');
  });
});
