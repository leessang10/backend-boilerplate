import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from '../../application/feature-flag.service';

export const FEATURE_FLAG_KEY = 'featureFlag';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.getAllAndOverride<string>(
      FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!featureKey) {
      // No feature flag specified, allow access
      return true;
    }

    const isEnabled = await this.featureFlagService.isEnabled(featureKey);

    if (!isEnabled) {
      throw new ForbiddenException(`Feature '${featureKey}' is not enabled`);
    }

    return true;
  }
}
