import { Inject, Injectable, Logger } from '@nestjs/common';
import { FEATURE_FLAG_CACHE_PORT } from '../domain/ports/feature-flag-cache.port';
import type { FeatureFlagCachePort } from '../domain/ports/feature-flag-cache.port';
import { FEATURE_FLAG_REPOSITORY_PORT } from '../domain/ports/feature-flag-repository.port';
import type { FeatureFlagRepositoryPort } from '../domain/ports/feature-flag-repository.port';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly cacheTTL = 300000; // 5 minutes

  constructor(
    @Inject(FEATURE_FLAG_REPOSITORY_PORT)
    private readonly featureFlagRepository: FeatureFlagRepositoryPort,
    @Inject(FEATURE_FLAG_CACHE_PORT)
    private readonly featureFlagCache: FeatureFlagCachePort,
  ) {}

  /**
   * Check if a feature is enabled
   */
  async isEnabled(key: string): Promise<boolean> {
    // Try to get from cache first
    const cached = await this.featureFlagCache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    // Get from database
    const feature = await this.featureFlagRepository.findByKey(key);

    if (!feature) {
      // Feature not found, default to disabled
      await this.featureFlagCache.set(key, false, this.cacheTTL);
      return false;
    }

    // Cache the result
    await this.featureFlagCache.set(key, feature.enabled, this.cacheTTL);

    return feature.enabled;
  }

  /**
   * Enable a feature
   */
  async enable(key: string): Promise<void> {
    await this.featureFlagRepository.upsertEnabled(key, true);

    // Invalidate cache
    await this.featureFlagCache.del(key);

    this.logger.log(`Feature enabled: ${key}`);
  }

  /**
   * Disable a feature
   */
  async disable(key: string): Promise<void> {
    await this.featureFlagRepository.updateEnabled(key, false);

    // Invalidate cache
    await this.featureFlagCache.del(key);

    this.logger.log(`Feature disabled: ${key}`);
  }

  /**
   * Toggle a feature
   */
  async toggle(key: string): Promise<boolean> {
    const feature = await this.featureFlagRepository.findByKey(key);

    if (!feature) {
      throw new Error(`Feature flag not found: ${key}`);
    }

    const newState = !feature.enabled;

    await this.featureFlagRepository.updateEnabled(key, newState);

    // Invalidate cache
    await this.featureFlagCache.del(key);

    this.logger.log(`Feature toggled: ${key} -> ${newState}`);

    return newState;
  }

  /**
   * Create a feature flag
   */
  async create(
    key: string,
    name: string,
    description?: string,
    enabled = false,
  ) {
    const feature = await this.featureFlagRepository.create({
      key,
      name,
      description,
      enabled,
    });

    this.logger.log(`Feature flag created: ${key}`);

    return feature;
  }

  /**
   * Get all feature flags
   */
  async findAll() {
    return this.featureFlagRepository.findAll();
  }

  /**
   * Get a specific feature flag
   */
  async findOne(key: string) {
    return this.featureFlagRepository.findByKey(key);
  }

  /**
   * Delete a feature flag
   */
  async delete(key: string): Promise<void> {
    await this.featureFlagRepository.deleteByKey(key);

    // Invalidate cache
    await this.featureFlagCache.del(key);

    this.logger.log(`Feature flag deleted: ${key}`);
  }

  /**
   * Clear feature flag cache
   */
  clearCache(): void {
    // This is a simple implementation
    // In production with Redis, you might want to use pattern matching
    this.logger.log('Feature flag cache cleared');
  }
}
