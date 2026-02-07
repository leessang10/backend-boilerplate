import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Decorator to set cache key pattern
 * @param keyPattern - Pattern for cache key, use {param} for dynamic values
 * @example @CacheKey('user:{id}')
 */
export const CacheKey = (keyPattern: string) =>
  SetMetadata(CACHE_KEY_METADATA, keyPattern);

/**
 * Decorator to set cache TTL (in seconds)
 * @param ttl - Time to live in seconds
 * @example @CacheTTL(600) // 10 minutes
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);
