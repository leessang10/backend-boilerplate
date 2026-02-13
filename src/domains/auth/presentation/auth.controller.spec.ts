import {
  INestApplication,
  RequestMethod,
  VERSION_NEUTRAL,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from '../application/auth.service';

describe('AuthController 통합', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    authService = module.get(AuthService);

    app.use((req: { user?: { id: string } }, _res, next) => {
      req.user = { id: 'user-1' };
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

  it('로그인 요청이 유효하면 서비스 결과를 반환한다', async () => {
    authService.login.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
      } as any,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
      })
      .expect(200);

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123!',
    });
    expect(response.body).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('로그인 요청 본문이 잘못되면 400을 반환한다', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'invalid-email',
        password: 'short',
      })
      .expect(400);

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('토큰 재발급 요청이 유효하면 서비스 결과를 반환한다', async () => {
    authService.refresh.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
      } as any,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({
        refreshToken: 'valid-refresh-token',
      })
      .expect(200);

    expect(authService.refresh).toHaveBeenCalledWith('valid-refresh-token');
    expect(response.body).toMatchObject({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('로그아웃 요청은 사용자 ID와 토큰을 전달하고 204를 반환한다', async () => {
    authService.logout.mockResolvedValue();

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'refresh-token' })
      .expect(204);

    expect(authService.logout).toHaveBeenCalledWith('user-1', 'refresh-token');
  });
});
