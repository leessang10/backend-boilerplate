import { Injectable, Logger } from '@nestjs/common';
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
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private emailQueue: Queue<EmailJobData>,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private notificationQueue: Queue<NotificationJobData>,
  ) {}

  /**
   * Add email to queue
   */
  async sendEmail(data: EmailJobData, options?: { delay?: number; priority?: number }) {
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
  async sendNotification(data: NotificationJobData, options?: { delay?: number }) {
    try {
      const job = await this.notificationQueue.add('send-notification', data, {
        delay: options?.delay,
      });
      this.logger.log(`Notification job ${job.id} added for user ${data.userId}`);
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
    const queue = queueName === QUEUE_NAMES.EMAIL ? this.emailQueue : this.notificationQueue;

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
}
