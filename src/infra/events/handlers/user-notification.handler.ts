import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserLoginEvent, UserLogoutEvent } from '@domains/auth';
import { QueueService } from '../../queue/queue.service';

@Injectable()
export class UserNotificationHandler {
  private readonly logger = new Logger(UserNotificationHandler.name);

  constructor(private readonly queueService: QueueService) {}

  @OnEvent('user.login')
  async handleUserLogin(event: UserLoginEvent) {
    this.logger.log(`Handling user.login event for ${event.email}`);

    try {
      await this.queueService.sendNotification({
        userId: event.userId,
        type: 'security',
        title: 'New Login',
        message: `New login detected from ${event.ipAddress || 'unknown IP'}`,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to queue login notification: ${errorMessage}`);
    }
  }

  @OnEvent('user.logout')
  handleUserLogout(event: UserLogoutEvent) {
    this.logger.log(`User ${event.email} logged out`);
    // Could add analytics tracking here
  }
}
