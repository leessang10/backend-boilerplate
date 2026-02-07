import { Module } from '@nestjs/common';
import { FeatureFlagController } from './presentation/feature-flag.controller';
import { FeatureFlagService } from './application/feature-flag.service';
import { FeatureFlagGuard } from './presentation/guards/feature-flag.guard';
import { FeatureFlagRepository } from './infrastructure/feature-flag.repository';
import { FeatureFlagCache } from './infrastructure/feature-flag.cache';
import { FEATURE_FLAG_REPOSITORY_PORT } from './domain/ports/feature-flag-repository.port';
import { FEATURE_FLAG_CACHE_PORT } from './domain/ports/feature-flag-cache.port';

@Module({
  controllers: [FeatureFlagController],
  providers: [
    FeatureFlagService,
    FeatureFlagGuard,
    FeatureFlagRepository,
    FeatureFlagCache,
    {
      provide: FEATURE_FLAG_REPOSITORY_PORT,
      useExisting: FeatureFlagRepository,
    },
    {
      provide: FEATURE_FLAG_CACHE_PORT,
      useExisting: FeatureFlagCache,
    },
  ],
  exports: [FeatureFlagService, FeatureFlagGuard],
})
export class FeatureFlagModule {}
