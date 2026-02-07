import { Module } from '@nestjs/common';
import { FeatureFlagController } from './presentation/feature-flag.controller';
import { FeatureFlagService } from './application/feature-flag.service';
import { FeatureFlagGuard } from './presentation/guards/feature-flag.guard';
import { PrismaModule } from '@infra/prisma/prisma.module';
import { CacheModule } from '@infra/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService, FeatureFlagGuard],
  exports: [FeatureFlagService, FeatureFlagGuard],
})
export class FeatureFlagModule {}
