import { Test, TestingModule } from '@nestjs/testing';
import { Role, type FeatureFlag } from '@prisma/client';
import { FeatureFlagService } from './feature-flag.service';
import {
  FEATURE_FLAG_CACHE_PORT,
  type FeatureFlagCachePort,
} from '../domain/ports/feature-flag-cache.port';
import {
  FEATURE_FLAG_REPOSITORY_PORT,
  type FeatureFlagRepositoryPort,
} from '../domain/ports/feature-flag-repository.port';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let repository: jest.Mocked<FeatureFlagRepositoryPort>;
  let cache: jest.Mocked<FeatureFlagCachePort>;

  const createFlag = (overrides: Partial<FeatureFlag> = {}): FeatureFlag => ({
    id: 'flag-1',
    key: 'new-dashboard',
    name: 'New Dashboard',
    enabled: false,
    description: 'Enable new dashboard UI',
    metadata: null,
    createdAt: new Date('2026-02-13T00:00:00.000Z'),
    updatedAt: new Date('2026-02-13T00:00:00.000Z'),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        {
          provide: FEATURE_FLAG_REPOSITORY_PORT,
          useValue: {
            findByKey: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            upsertEnabled: jest.fn(),
            updateEnabled: jest.fn(),
            deleteByKey: jest.fn(),
          },
        },
        {
          provide: FEATURE_FLAG_CACHE_PORT,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(FeatureFlagService);
    repository = module.get(FEATURE_FLAG_REPOSITORY_PORT);
    cache = module.get(FEATURE_FLAG_CACHE_PORT);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('기능 활성 여부 확인', () => {
    it('캐시에 값이 있으면 DB 조회 없이 캐시 값을 반환한다', async () => {
      cache.get.mockResolvedValue(true);

      const result = await service.isEnabled('new-dashboard');

      expect(result).toBe(true);
      expect(repository.findByKey).not.toHaveBeenCalled();
    });

    it('캐시 미스이고 기능이 없으면 false를 캐시하고 반환한다', async () => {
      cache.get.mockResolvedValue(undefined);
      repository.findByKey.mockResolvedValue(null);

      const result = await service.isEnabled('missing-feature');

      expect(result).toBe(false);
      expect(cache.set).toHaveBeenCalledWith('missing-feature', false, 300000);
    });

    it('캐시 미스이고 기능이 있으면 enabled 값을 캐시하고 반환한다', async () => {
      cache.get.mockResolvedValue(undefined);
      repository.findByKey.mockResolvedValue(createFlag({ enabled: true }));

      const result = await service.isEnabled('new-dashboard');

      expect(result).toBe(true);
      expect(cache.set).toHaveBeenCalledWith('new-dashboard', true, 300000);
    });
  });

  describe('기능 상태 변경', () => {
    it('enable은 저장소를 활성화하고 캐시를 무효화한다', async () => {
      repository.upsertEnabled.mockResolvedValue();
      cache.del.mockResolvedValue();

      await service.enable('new-dashboard');

      expect(repository.upsertEnabled).toHaveBeenCalledWith(
        'new-dashboard',
        true,
      );
      expect(cache.del).toHaveBeenCalledWith('new-dashboard');
    });

    it('disable은 저장소를 비활성화하고 캐시를 무효화한다', async () => {
      repository.updateEnabled.mockResolvedValue();
      cache.del.mockResolvedValue();

      await service.disable('new-dashboard');

      expect(repository.updateEnabled).toHaveBeenCalledWith(
        'new-dashboard',
        false,
      );
      expect(cache.del).toHaveBeenCalledWith('new-dashboard');
    });

    it('toggle은 상태를 반전하고 새 상태를 반환한다', async () => {
      repository.findByKey.mockResolvedValue(createFlag({ enabled: false }));
      repository.updateEnabled.mockResolvedValue();
      cache.del.mockResolvedValue();

      const result = await service.toggle('new-dashboard');

      expect(result).toBe(true);
      expect(repository.updateEnabled).toHaveBeenCalledWith(
        'new-dashboard',
        true,
      );
      expect(cache.del).toHaveBeenCalledWith('new-dashboard');
    });

    it('toggle 대상 기능이 없으면 예외를 던진다', async () => {
      repository.findByKey.mockResolvedValue(null);

      await expect(service.toggle('missing-feature')).rejects.toThrow(
        new Error('Feature flag not found: missing-feature'),
      );
    });
  });

  describe('기능 CRUD', () => {
    it('create는 기본 enabled=false로 기능을 생성한다', async () => {
      const flag = createFlag({ enabled: false });
      repository.create.mockResolvedValue(flag);

      const result = await service.create(
        'new-dashboard',
        'New Dashboard',
        'desc',
      );

      expect(repository.create).toHaveBeenCalledWith({
        key: 'new-dashboard',
        name: 'New Dashboard',
        description: 'desc',
        enabled: false,
      });
      expect(result).toEqual(flag);
    });

    it('findAll은 저장소 결과를 반환한다', async () => {
      const flags = [createFlag(), createFlag({ key: 'beta-api' })];
      repository.findAll.mockResolvedValue(flags);

      const result = await service.findAll();

      expect(result).toEqual(flags);
    });

    it('findOne은 key 기반 조회 결과를 반환한다', async () => {
      const flag = createFlag();
      repository.findByKey.mockResolvedValue(flag);

      const result = await service.findOne('new-dashboard');

      expect(repository.findByKey).toHaveBeenCalledWith('new-dashboard');
      expect(result).toEqual(flag);
    });

    it('delete는 기능을 삭제하고 캐시를 무효화한다', async () => {
      repository.deleteByKey.mockResolvedValue();
      cache.del.mockResolvedValue();

      await service.delete('new-dashboard');

      expect(repository.deleteByKey).toHaveBeenCalledWith('new-dashboard');
      expect(cache.del).toHaveBeenCalledWith('new-dashboard');
    });

    it('clearCache는 예외 없이 호출된다', () => {
      expect(() => service.clearCache()).not.toThrow();
    });
  });
});
