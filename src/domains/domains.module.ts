import { Module } from '@nestjs/common';
import { UserModule } from '@domains/user';
import { AuthModule } from '@domains/auth';
import { FeatureFlagModule } from '@domains/feature-flag';

@Module({
  imports: [UserModule, AuthModule, FeatureFlagModule],
})
export class DomainsModule {}
