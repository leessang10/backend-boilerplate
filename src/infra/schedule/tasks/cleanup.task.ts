import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { withDistributedLock } from '../decorators/distributed-cron.decorator';

@Injectable()
export class CleanupTask {
  private readonly logger = new Logger(CleanupTask.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Clean up expired refresh tokens every day at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'cleanup-expired-tokens',
    timeZone: 'UTC',
  })
  @withDistributedLock('cleanup-expired-tokens', 300000) // 5 minute lock
  async cleanupExpiredTokens() {
    this.logger.log('Starting cleanup of expired refresh tokens');

    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
    } catch (error) {
      this.logger.error(`Failed to cleanup expired tokens: ${error.message}`);
    }
  }

  /**
   * Clean up old audit logs (older than 90 days) every week
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'cleanup-old-audit-logs',
    timeZone: 'UTC',
  })
  @withDistributedLock('cleanup-old-audit-logs', 600000) // 10 minute lock
  async cleanupOldAuditLogs() {
    this.logger.log('Starting cleanup of old audit logs');

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} old audit logs`);
    } catch (error) {
      this.logger.error(`Failed to cleanup old audit logs: ${error.message}`);
    }
  }

  /**
   * Clean up expired idempotency keys every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'cleanup-expired-idempotency-keys',
    timeZone: 'UTC',
  })
  @withDistributedLock('cleanup-expired-idempotency-keys', 120000) // 2 minute lock
  async cleanupExpiredIdempotencyKeys() {
    this.logger.log('Starting cleanup of expired idempotency keys');

    try {
      const result = await this.prisma.idempotencyKey.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired idempotency keys`);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup expired idempotency keys: ${error.message}`,
      );
    }
  }
}
