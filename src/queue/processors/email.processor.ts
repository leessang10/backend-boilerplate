import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter } from 'prom-client';
import { QUEUE_NAMES } from '../queue.constants';
import { EmailJobData } from '../queue.service';

@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @InjectMetric('queue_jobs_completed_total')
    private readonly completedCounter: Counter<string>,
    @InjectMetric('queue_jobs_failed_total')
    private readonly failedCounter: Counter<string>,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    this.logger.log(`Processing email job ${job.id} for ${job.data.to}`);

    try {
      // Simulate email sending
      // In production, integrate with AWS SES, SendGrid, Mailgun, etc.
      await this.sendEmail(job.data);

      this.logger.log(`Email sent successfully to ${job.data.to}`);
      this.completedCounter.inc({ queue: QUEUE_NAMES.EMAIL });
      return { success: true, sentAt: new Date() };
    } catch (error) {
      this.logger.error(`Failed to send email to ${job.data.to}: ${error.message}`);
      this.failedCounter.inc({ queue: QUEUE_NAMES.EMAIL });
      throw error; // Will trigger retry based on job options
    }
  }

  private async sendEmail(data: EmailJobData): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, implement actual email sending logic
    this.logger.debug(`
      ============================================
      📧 EMAIL SENT (simulated)
      To: ${data.to}
      Subject: ${data.subject}
      Body: ${data.body}
      Template: ${data.template || 'default'}
      ============================================
    `);
  }
}
