import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUE_NAMES } from './queue.constants';

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  template?: string;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private emailQueue: Queue<EmailJobData>,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private notificationQueue: Queue<NotificationJobData>,
  ) {}

  /**
   * Add email to queue
   */
  async sendEmail(
    data: EmailJobData,
    options?: { delay?: number; priority?: number },
  ) {
    try {
      const job = await this.emailQueue.add('send-email', data, {
        delay: options?.delay,
        priority: options?.priority,
      });
      this.logger.log(`Email job ${job.id} added to queue for ${data.to}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add email job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add notification to queue
   */
  async sendNotification(
    data: NotificationJobData,
    options?: { delay?: number },
  ) {
    try {
      const job = await this.notificationQueue.add('send-notification', data, {
        delay: options?.delay,
      });
      this.logger.log(
        `Notification job ${job.id} added for user ${data.userId}`,
      );
      return job;
    } catch (error) {
      this.logger.error(`Failed to add notification job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string) {
    const queue =
      queueName === QUEUE_NAMES.EMAIL
        ? this.emailQueue
        : this.notificationQueue;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Gracefully close all queues during shutdown
   * Waits for active jobs to complete before closing
   */
  async onModuleDestroy() {
    this.logger.log('Closing Bull queues gracefully...');

    await Promise.all([
      this.closeQueue(this.emailQueue, QUEUE_NAMES.EMAIL),
      this.closeQueue(this.notificationQueue, QUEUE_NAMES.NOTIFICATION),
    ]);

    this.logger.log('All Bull queues closed');
  }

  /**
   * Close individual queue and wait for active jobs
   */
  private async closeQueue(queue: Queue, name: string): Promise<void> {
    try {
      const activeCount = await queue.getActiveCount();
      if (activeCount > 0) {
        this.logger.log(
          `Waiting for ${activeCount} active job(s) in ${name} queue...`,
        );
      }

      // queue.close() waits for active jobs to complete
      await queue.close();
      this.logger.log(`${name} queue closed`);
    } catch (error) {
      this.logger.error(
        `Failed to close ${name} queue: ${error.message}`,
        error.stack,
      );
    }
  }
}
