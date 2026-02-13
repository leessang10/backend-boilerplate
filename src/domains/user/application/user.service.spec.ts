import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, type User } from '@prisma/client';
import * as argon2 from 'argon2';
import { CryptoService } from '@shared/crypto/crypto.service';
import { UserService } from './user.service';
import { UserRepository } from '../infrastructure/user.repository';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

const mockedArgon2 = jest.mocked(argon2);

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let cryptoService: jest.Mocked<CryptoService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            encrypt: jest.fn((value: string) => `encrypted:${value}`),
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

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    cryptoService = module.get(CryptoService);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('사용자 생성', () => {
    it('중복 이메일이 없으면 사용자를 생성하고 이벤트를 발행한다', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      mockedArgon2.hash.mockResolvedValue('hashed:new-password');
      userRepository.create.mockResolvedValue(createUser());

      const result = await service.create({
        email: 'user@example.com',
        password: 'new-password',
        firstName: 'Test',
        lastName: 'User',
        phone: '01012345678',
        role: Role.USER,
      });

      expect(mockedArgon2.hash).toHaveBeenCalledWith('new-password');
      expect(cryptoService.encrypt).toHaveBeenCalledWith('01012345678');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          password: 'hashed:new-password',
          phone: 'encrypted:01012345678',
          role: Role.USER,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.created',
        expect.objectContaining({
          userId: 'user-1',
          email: 'user@example.com',
          role: Role.USER,
        }),
      );
      expect(result.phone).toBe('decrypted:encrypted-phone');
    });

    it('중복 이메일이 있으면 충돌 예외를 던진다', async () => {
      userRepository.findByEmail.mockResolvedValue(createUser());

      await expect(
        service.create({
          email: 'user@example.com',
          password: 'new-password',
        }),
      ).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
      expect(mockedArgon2.hash).not.toHaveBeenCalled();
    });
  });

  describe('사용자 목록 조회', () => {
    it('검색/역할/정렬 조건으로 목록과 페이지 정보를 반환한다', async () => {
      userRepository.count.mockResolvedValue(11);
      userRepository.findMany.mockResolvedValue([
        createUser({ id: 'user-1' }),
        createUser({ id: 'user-2', email: 'user2@example.com' }),
      ]);

      const result = await service.findAll({
        page: 2,
        limit: 5,
        search: 'user',
        role: Role.USER,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(userRepository.count).toHaveBeenCalledWith({
        OR: [
          { email: { contains: 'user', mode: 'insensitive' } },
          { firstName: { contains: 'user', mode: 'insensitive' } },
          { lastName: { contains: 'user', mode: 'insensitive' } },
        ],
        role: Role.USER,
      });
      expect(userRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.USER }),
        5,
        5,
        { createdAt: 'desc' },
      );
      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 2,
        limit: 5,
        total: 11,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('기본 페이지 파라미터로 목록을 조회한다', async () => {
      userRepository.count.mockResolvedValue(0);
      userRepository.findMany.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(userRepository.findMany).toHaveBeenCalledWith({}, 0, 10, {
        createdAt: 'desc',
      });
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    });
  });

  describe('단건 조회', () => {
    it('사용자가 존재하면 사용자 정보를 반환한다', async () => {
      userRepository.findById.mockResolvedValue(createUser());

      const result = await service.findOne('user-1');

      expect(result.id).toBe('user-1');
      expect(result.phone).toBe('decrypted:encrypted-phone');
    });

    it('사용자가 없으면 예외를 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('이메일 조회', () => {
    it('저장소 조회 결과를 그대로 반환한다', async () => {
      const user = createUser();
      userRepository.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail('user@example.com');

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
      expect(result).toEqual(user);
    });
  });

  describe('사용자 수정', () => {
    it('사용자가 존재하면 정보를 수정하고 변경 이벤트를 발행한다', async () => {
      userRepository.findById.mockResolvedValue(createUser());
      userRepository.update.mockResolvedValue(
        createUser({ firstName: 'Updated', phone: 'encrypted:01099998888' }),
      );

      const result = await service.update('user-1', {
        firstName: 'Updated',
        phone: '01099998888',
        isActive: false,
      });

      expect(cryptoService.encrypt).toHaveBeenCalledWith('01099998888');
      expect(userRepository.update).toHaveBeenCalledWith('user-1', {
        firstName: 'Updated',
        lastName: undefined,
        phone: 'encrypted:01099998888',
        role: undefined,
        isActive: false,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.updated',
        expect.objectContaining({
          userId: 'user-1',
          email: 'user@example.com',
          changes: {
            firstName: 'Updated',
            phone: '01099998888',
            isActive: false,
          },
        }),
      );
      expect(result.firstName).toBe('Updated');
      expect(result.phone).toBe('decrypted:encrypted:01099998888');
    });

    it('사용자가 없으면 예외를 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('missing', { firstName: 'Updated' }),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('사용자 삭제', () => {
    it('사용자가 존재하면 삭제하고 이벤트를 발행한다', async () => {
      const user = createUser();
      userRepository.findById.mockResolvedValue(user);
      userRepository.delete.mockResolvedValue(user);

      await service.remove(user.id);

      expect(userRepository.delete).toHaveBeenCalledWith(user.id);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.deleted',
        expect.objectContaining({
          userId: user.id,
          email: user.email,
        }),
      );
    });

    it('사용자가 없으면 예외를 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(userRepository.delete).not.toHaveBeenCalled();
    });
  });
});
