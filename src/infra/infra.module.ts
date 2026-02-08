import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { QueueModule } from './queue/queue.module';
import { BullBoardFeatureModule } from './queue/bull-board.module';
import { EventsModule } from './events/events.module';
import { ScheduleModule } from './schedule/schedule.module';
import { HealthModule } from '@infra/health';
import { MetricsModule } from '@infra/metrics';
import { UploadModule } from '@infra/upload';
import { StreamingModule } from '@infra/streaming';
import { AuditModule } from '@infra/audit';
import { WebsocketModule } from '@infra/websocket';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    QueueModule,
    BullBoardFeatureModule,
    EventsModule,
    ScheduleModule,
    HealthModule,
    MetricsModule,
    UploadModule,
    StreamingModule,
    AuditModule,
    WebsocketModule,
  ],
  exports: [
    PrismaModule,
    CacheModule,
    QueueModule,
    BullBoardFeatureModule,
    EventsModule,
    ScheduleModule,
    HealthModule,
    MetricsModule,
    UploadModule,
    StreamingModule,
    AuditModule,
    WebsocketModule,
  ],
})
export class InfraModule {}
