import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { CleanupTask } from './tasks/cleanup.task';
import { HealthCheckTask } from './tasks/health-check.task';
import { CacheModule } from '../cache/cache.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [NestScheduleModule.forRoot(), CacheModule, PrismaModule],
  providers: [CleanupTask, HealthCheckTask],
})
export class ScheduleModule {}
