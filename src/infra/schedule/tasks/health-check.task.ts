import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { withDistributedLock } from '../decorators/distributed-cron.decorator';

@Injectable()
export class HealthCheckTask {
  private readonly logger = new Logger(HealthCheckTask.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Check system health every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'system-health-check',
    timeZone: 'UTC',
  })
  @withDistributedLock('system-health-check', 60000) // 1 minute lock
  async checkSystemHealth() {
    this.logger.debug('Running system health check');

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      // Check cache connection
      await this.cacheManager.set('health-check', Date.now(), 60000);
      await this.cacheManager.get('health-check');

      this.logger.debug('System health check passed');
    } catch (error) {
      this.logger.error(`System health check failed: ${error.message}`);
      // In production, you might want to send alerts here
      // For example, send to Slack, PagerDuty, etc.
    }
  }

  /**
   * Log system statistics every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: 'log-system-stats',
    timeZone: 'UTC',
  })
  @withDistributedLock('log-system-stats', 60000) // 1 minute lock
  async logSystemStats() {
    this.logger.debug('Logging system statistics');

    try {
      const [userCount, activeUserCount, tokenCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.refreshToken.count(),
      ]);

      this.logger.log({
        msg: 'System Statistics',
        totalUsers: userCount,
        activeUsers: activeUserCount,
        activeTokens: tokenCount,
        memoryUsage: process.memoryUsage(),
      });
    } catch (error) {
      this.logger.error(`Failed to log system stats: ${error.message}`);
    }
  }
}
