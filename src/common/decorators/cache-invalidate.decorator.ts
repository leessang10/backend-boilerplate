import { SetMetadata } from '@nestjs/common';

export const CACHE_INVALIDATE_METADATA = 'cache:invalidate';

/**
 * Decorator to invalidate cache keys after method execution
 * @param patterns - Array of cache key patterns to invalidate
 * @example @CacheInvalidate(['user:*', 'users:list'])
 */
export const CacheInvalidate = (patterns: string[]) =>
  SetMetadata(CACHE_INVALIDATE_METADATA, patterns);
