import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getBullConfig } from '../../config/bull.config';
import { EmailProcessor } from './processors/email.processor';
import { QueueService } from './queue.service';
import { QUEUE_NAMES } from './queue.constants';
import { MetricsModule } from '@domains/metrics';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getBullConfig,
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.NOTIFICATION },
    ),
    MetricsModule,
  ],
  providers: [EmailProcessor, QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
