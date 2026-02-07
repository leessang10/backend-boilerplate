import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { QueueModule } from './queue/queue.module';
import { BullBoardFeatureModule } from './queue/bull-board.module';
import { EventsModule } from './events/events.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    QueueModule,
    BullBoardFeatureModule,
    EventsModule,
    ScheduleModule,
  ],
  exports: [
    PrismaModule,
    CacheModule,
    QueueModule,
    BullBoardFeatureModule,
    EventsModule,
    ScheduleModule,
  ],
})
export class InfraModule {}
