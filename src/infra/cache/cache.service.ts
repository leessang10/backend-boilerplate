import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * Wrapper service for cache manager with lifecycle management
 * Provides graceful shutdown of Redis connections
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Reset entire cache
   */
  async reset(): Promise<void> {
    await this.cacheManager.clear();
  }

  /**
   * Gracefully close Redis cache connection during shutdown
   */
  async onModuleDestroy() {
    this.logger.log('Closing Redis cache connection...');

    try {
      await this.cacheManager.disconnect();
      this.logger.log('Redis cache connection closed');
    } catch (error) {
      this.logger.error(
        `Failed to close cache connections: ${error.message}`,
        error.stack,
      );
    }
  }
}
