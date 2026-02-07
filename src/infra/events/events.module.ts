import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserEmailHandler } from './handlers/user-email.handler';
import { UserNotificationHandler } from './handlers/user-notification.handler';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    QueueModule,
  ],
  providers: [UserEmailHandler, UserNotificationHandler],
  exports: [EventEmitterModule],
})
export class EventsModule {}
