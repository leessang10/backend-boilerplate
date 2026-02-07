import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from '../modules/health/health.module';
import { UploadModule } from '../modules/upload/upload.module';
import { StreamingModule } from '../modules/streaming/streaming.module';
import { WebsocketModule } from '../modules/websocket/websocket.module';
import { AuditModule } from '../modules/audit/audit.module';
import { FeatureFlagModule } from '../modules/feature-flag/feature-flag.module';

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
