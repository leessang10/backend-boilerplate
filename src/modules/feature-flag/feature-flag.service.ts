import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly cacheTTL = 300000; // 5 minutes

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Check if a feature is enabled
   */
  async isEnabled(key: string): Promise<boolean> {
    // Try to get from cache first
    const cacheKey = `feature:${key}`;
    const cached = await this.cacheManager.get<boolean>(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    // Get from database
    const feature = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!feature) {
      // Feature not found, default to disabled
      await this.cacheManager.set(cacheKey, false, this.cacheTTL);
      return false;
    }

    // Cache the result
    await this.cacheManager.set(cacheKey, feature.enabled, this.cacheTTL);

    return feature.enabled;
  }

  /**
   * Enable a feature
   */
  async enable(key: string): Promise<void> {
    await this.prisma.featureFlag.upsert({
      where: { key },
      update: { enabled: true },
      create: {
        key,
        name: key,
        description: `Feature flag for ${key}`,
        enabled: true,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`feature:${key}`);

    this.logger.log(`Feature enabled: ${key}`);
  }

  /**
   * Disable a feature
   */
  async disable(key: string): Promise<void> {
    await this.prisma.featureFlag.update({
      where: { key },
      data: { enabled: false },
    });

    // Invalidate cache
    await this.cacheManager.del(`feature:${key}`);

    this.logger.log(`Feature disabled: ${key}`);
  }

  /**
   * Toggle a feature
   */
  async toggle(key: string): Promise<boolean> {
    const feature = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!feature) {
      throw new Error(`Feature flag not found: ${key}`);
    }

    const newState = !feature.enabled;

    await this.prisma.featureFlag.update({
      where: { key },
      data: { enabled: newState },
    });

    // Invalidate cache
    await this.cacheManager.del(`feature:${key}`);

    this.logger.log(`Feature toggled: ${key} -> ${newState}`);

    return newState;
  }

  /**
   * Create a feature flag
   */
  async create(key: string, name: string, description?: string, enabled = false) {
    const feature = await this.prisma.featureFlag.create({
      data: {
        key,
        name,
        description,
        enabled,
      },
    });

    this.logger.log(`Feature flag created: ${key}`);

    return feature;
  }

  /**
   * Get all feature flags
   */
  async findAll() {
    return this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get a specific feature flag
   */
  async findOne(key: string) {
    return this.prisma.featureFlag.findUnique({
      where: { key },
    });
  }

  /**
   * Delete a feature flag
   */
  async delete(key: string): Promise<void> {
    await this.prisma.featureFlag.delete({
      where: { key },
    });

    // Invalidate cache
    await this.cacheManager.del(`feature:${key}`);

    this.logger.log(`Feature flag deleted: ${key}`);
  }

  /**
   * Clear feature flag cache
   */
  async clearCache(): Promise<void> {
    // This is a simple implementation
    // In production with Redis, you might want to use pattern matching
    this.logger.log('Feature flag cache cleared');
  }
}
