import { Module } from '@nestjs/common';
import { FeatureFlagController } from './feature-flag.controller';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagGuard } from './guards/feature-flag.guard';
import { PrismaModule } from '@infra/prisma/prisma.module';
import { CacheModule } from '@infra/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService, FeatureFlagGuard],
  exports: [FeatureFlagService, FeatureFlagGuard],
})
export class FeatureFlagModule {}
