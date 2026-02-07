import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { FeatureFlagCachePort } from '../domain/ports/feature-flag-cache.port';

@Injectable()
export class FeatureFlagCache implements FeatureFlagCachePort {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  get(key: string): Promise<boolean | undefined> {
    return this.cacheManager.get<boolean>(this.toCacheKey(key));
  }

  async set(key: string, enabled: boolean, ttlMs: number): Promise<void> {
    await this.cacheManager.set(this.toCacheKey(key), enabled, ttlMs);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(this.toCacheKey(key));
  }

  private toCacheKey(key: string): string {
    return `feature:${key}`;
  }
}
