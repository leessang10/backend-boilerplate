import { Module } from '@nestjs/common';
import { UserModule } from '@domains/user';
import { AuthModule } from '@domains/auth';
import { HealthModule } from '@domains/health';
import { UploadModule } from '@domains/upload';
import { StreamingModule } from '@domains/streaming';
import { WebsocketModule } from '@domains/websocket';
import { AuditModule } from '@domains/audit';
import { FeatureFlagModule } from '@domains/feature-flag';

@Module({
  imports: [
    UserModule,
    AuthModule,
    HealthModule,
    UploadModule,
    StreamingModule,
    WebsocketModule,
    AuditModule,
    FeatureFlagModule,
  ],
})
export class DomainsModule {}
