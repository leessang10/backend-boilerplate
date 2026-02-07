import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Distributed lock decorator to prevent duplicate cron executions
 * Use this wrapper around your cron methods
 */
export function withDistributedLock(lockKey: string, ttl: number = 60000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache: Cache = this.cacheManager;

      if (!cache) {
        throw new Error(
          'Cache manager not injected. Make sure CacheModule is imported.',
        );
      }

      const lockValue = `lock:${lockKey}`;

      try {
        // Try to acquire lock
        const existingLock = await cache.get(lockValue);

        if (existingLock) {
          this.logger?.debug(
            `Skipping ${propertyKey}: lock already held by another instance`,
          );
          return;
        }

        // Acquire lock
        await cache.set(lockValue, Date.now(), ttl);

        // Execute the original method
        return await originalMethod.apply(this, args);
      } catch (error) {
        this.logger?.error(`Error in ${propertyKey}: ${error.message}`);
        throw error;
      } finally {
        // Release lock
        await cache.del(lockValue);
      }
    };

    return descriptor;
  };
}
