import { SetMetadata } from '@nestjs/common';
import { FEATURE_FLAG_KEY } from '../../modules/feature-flag/guards/feature-flag.guard';

/**
 * Decorator to protect a route with a feature flag
 * Usage: @FeatureFlag('new-dashboard')
 */
export const FeatureFlag = (featureKey: string) => SetMetadata(FEATURE_FLAG_KEY, featureKey);
