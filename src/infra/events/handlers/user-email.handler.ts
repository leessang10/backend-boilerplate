import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  UserCreatedEvent,
  UserDeletedEvent,
  UserPasswordChangedEvent,
} from '@domains/user';
import { QueueService } from '../../queue/queue.service';

@Injectable()
export class UserEmailHandler {
  private readonly logger = new Logger(UserEmailHandler.name);

  constructor(private readonly queueService: QueueService) {}

  @OnEvent('user.created')
  async handleUserCreated(event: UserCreatedEvent) {
    this.logger.log(`Handling user.created event for ${event.email}`);

    try {
      await this.queueService.sendEmail({
        to: event.email,
        subject: 'Welcome to Our Platform!',
        body: `Hello! Your account has been created successfully. Your user ID is: ${event.userId}`,
        template: 'welcome',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to queue welcome email: ${errorMessage}`);
    }
  }

  @OnEvent('user.password-changed')
  async handlePasswordChanged(event: UserPasswordChangedEvent) {
    this.logger.log(`Handling user.password-changed event for ${event.email}`);

    try {
      await this.queueService.sendEmail({
        to: event.email,
        subject: 'Password Changed',
        body: 'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
        template: 'password-changed',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to queue password change email: ${errorMessage}`,
      );
    }
  }

  @OnEvent('user.deleted')
  async handleUserDeleted(event: UserDeletedEvent) {
    this.logger.log(`Handling user.deleted event for ${event.email}`);

    try {
      await this.queueService.sendEmail({
        to: event.email,
        subject: 'Account Deleted',
        body: 'Your account has been deleted. We are sorry to see you go.',
        template: 'account-deleted',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to queue account deletion email: ${errorMessage}`,
      );
    }
  }
}
