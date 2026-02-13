import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, type RefreshToken, type User } from '@prisma/client';
import * as argon2 from 'argon2';
import { USER_READER_PORT, type UserReaderPort } from '@domains/user';
import { CryptoService } from '@shared/crypto/crypto.service';
import { AuthService } from './auth.service';
import { AuthRepository } from '../infrastructure/auth.repository';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

const mockedArgon2 = jest.mocked(argon2);

describe('AuthService', () => {
  let service: AuthService;

  let authRepository: jest.Mocked<AuthRepository>;
  let userReader: jest.Mocked<UserReaderPort>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let cryptoService: jest.Mocked<CryptoService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const jwtConfig = {
    access: { secret: 'access-secret', expiresIn: '15m' },
    refresh: { secret: 'refresh-secret', expiresIn: '7d' },
  };

  const now = new Date('2026-02-13T00:00:00.000Z');

  const createUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'user@example.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    phone: 'encrypted-phone',
    role: Role.USER,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  const createRefreshTokenWithUser = (
    overrides: Partial<RefreshToken & { user: User }> = {},
  ): RefreshToken & { user: User } => ({
    id: 'rt-1',
    token: 'valid-refresh-token',
    userId: 'user-1',
    expiresAt: new Date('2026-03-01T00:00:00.000Z'),
    createdAt: now,
    user: createUser(),
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findRefreshTokenWithUser: jest.fn(),
            deleteRefreshToken: jest.fn(),
            createRefreshToken: jest.fn(),
            deleteRefreshTokens: jest.fn(),
            findUserById: jest.fn(),
          },
        },
        {
          provide: USER_READER_PORT,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(jwtConfig),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            decrypt: jest.fn((value: string) => `decrypted:${value}`),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    userReader = module.get(USER_READER_PORT);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    cryptoService = module.get(CryptoService);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('로그인', () => {
    it('유효한 자격 증명일 때 토큰을 반환하고 로그인 이벤트를 발행한다', async () => {
      const user = createUser();
      userReader.findByEmail.mockResolvedValue(user);
      mockedArgon2.verify.mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      authRepository.createRefreshToken.mockResolvedValue(
        createRefreshTokenWithUser(),
      );

      const result = await service.login({
        email: user.email,
        password: 'password',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe(user.email);
      expect(result.user.phone).toBe('decrypted:encrypted-phone');

      expect(mockedArgon2.verify).toHaveBeenCalledWith(
        user.password,
        'password',
      );
      expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
        user.id,
        'refresh-token',
        expect.any(Date),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.login',
        expect.objectContaining({ userId: user.id, email: user.email }),
      );
      expect(cryptoService.decrypt).toHaveBeenCalledWith('encrypted-phone');
    });

    it('사용자가 없으면 예외를 던진다', async () => {
      userReader.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'password' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
      expect(mockedArgon2.verify).not.toHaveBeenCalled();
    });

    it('사용자가 비활성 상태면 예외를 던진다', async () => {
      userReader.findByEmail.mockResolvedValue(createUser({ isActive: false }));

      await expect(
        service.login({ email: 'user@example.com', password: 'password' }),
      ).rejects.toThrow(new UnauthorizedException('User account is inactive'));
      expect(mockedArgon2.verify).not.toHaveBeenCalled();
    });

    it('비밀번호가 일치하지 않으면 예외를 던진다', async () => {
      userReader.findByEmail.mockResolvedValue(createUser());
      mockedArgon2.verify.mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
      expect(authRepository.createRefreshToken).not.toHaveBeenCalled();
    });

    it('JWT 설정이 없으면 예외를 던진다', async () => {
      userReader.findByEmail.mockResolvedValue(createUser());
      mockedArgon2.verify.mockResolvedValue(true);
      configService.get.mockReturnValueOnce(undefined);

      await expect(
        service.login({ email: 'user@example.com', password: 'password' }),
      ).rejects.toThrow(new Error('JWT configuration is missing'));
    });

    it('리프레시 토큰 만료 형식이 잘못되면 예외를 던진다', async () => {
      userReader.findByEmail.mockResolvedValue(createUser());
      mockedArgon2.verify.mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      configService.get.mockReturnValue({
        access: { secret: 'access-secret', expiresIn: '15m' },
        refresh: { secret: 'refresh-secret', expiresIn: '7x' },
      });

      await expect(
        service.login({ email: 'user@example.com', password: 'password' }),
      ).rejects.toThrow(new Error('Invalid refresh token expiration format'));
    });
  });

  describe('토큰 재발급', () => {
    it('리프레시 토큰을 교체하고 새 토큰을 반환한다', async () => {
      const storedToken = createRefreshTokenWithUser();
      jwtService.verify.mockReturnValue(storedToken.user);
      authRepository.findRefreshTokenWithUser.mockResolvedValue(storedToken);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      authRepository.deleteRefreshToken.mockResolvedValue(storedToken);
      authRepository.createRefreshToken.mockResolvedValue(
        createRefreshTokenWithUser({ token: 'new-refresh-token' }),
      );

      const result = await service.refresh(storedToken.token);

      expect(jwtService.verify).toHaveBeenCalledWith(storedToken.token, {
        secret: jwtConfig.refresh.secret,
      });
      expect(authRepository.deleteRefreshToken).toHaveBeenCalledWith(
        storedToken.token,
      );
      expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
        storedToken.user.id,
        'new-refresh-token',
        expect.any(Date),
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.user.phone).toBe('decrypted:encrypted-phone');
    });

    it('토큰 검증에 실패하면 인증 예외를 던진다', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });

    it('저장된 토큰이 없으면 인증 예외를 던진다', async () => {
      jwtService.verify.mockReturnValue(createUser());
      authRepository.findRefreshTokenWithUser.mockResolvedValue(null);

      await expect(service.refresh('missing-token')).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });

    it('저장된 토큰이 만료되면 인증 예외를 던진다', async () => {
      jwtService.verify.mockReturnValue(createUser());
      authRepository.findRefreshTokenWithUser.mockResolvedValue(
        createRefreshTokenWithUser({
          expiresAt: new Date('2020-01-01T00:00:00.000Z'),
        }),
      );

      await expect(service.refresh('expired-token')).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });

    it('사용자가 비활성 상태면 인증 예외를 던진다', async () => {
      jwtService.verify.mockReturnValue(createUser());
      authRepository.findRefreshTokenWithUser.mockResolvedValue(
        createRefreshTokenWithUser({
          user: createUser({ isActive: false }),
        }),
      );

      await expect(service.refresh('inactive-user-token')).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });
  });

  describe('로그아웃', () => {
    it('사용자가 존재하면 리프레시 토큰을 삭제하고 로그아웃 이벤트를 발행한다', async () => {
      const user = createUser();
      authRepository.deleteRefreshTokens.mockResolvedValue({ count: 1 });
      authRepository.findUserById.mockResolvedValue(user);

      await service.logout(user.id, 'refresh-token');

      expect(authRepository.deleteRefreshTokens).toHaveBeenCalledWith(
        user.id,
        'refresh-token',
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.logout',
        expect.objectContaining({ userId: user.id, email: user.email }),
      );
    });

    it('사용자를 찾지 못하면 로그아웃 이벤트를 발행하지 않는다', async () => {
      authRepository.deleteRefreshTokens.mockResolvedValue({ count: 0 });
      authRepository.findUserById.mockResolvedValue(null);

      await service.logout('missing-user-id');

      expect(authRepository.deleteRefreshTokens).toHaveBeenCalledWith(
        'missing-user-id',
        undefined,
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('사용자 검증', () => {
    it('사용자가 존재하고 활성 상태면 사용자 정보를 반환한다', async () => {
      const user = createUser({ isActive: true });
      authRepository.findUserById.mockResolvedValue(user);

      const result = await service.validateUser(user.id);

      expect(result).toEqual(user);
    });

    it('사용자가 없으면 null을 반환한다', async () => {
      authRepository.findUserById.mockResolvedValue(null);

      const result = await service.validateUser('missing-user');

      expect(result).toBeNull();
    });

    it('사용자가 비활성 상태면 null을 반환한다', async () => {
      authRepository.findUserById.mockResolvedValue(
        createUser({ isActive: false }),
      );

      const result = await service.validateUser('inactive-user');

      expect(result).toBeNull();
    });
  });
});
