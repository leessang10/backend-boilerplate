import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

type ShutdownCapableWebsocketGateway = {
  gracefulShutdown: (timeoutMs: number) => Promise<void>;
};

@Injectable()
export class ShutdownService implements OnModuleInit {
  private readonly logger = new Logger(ShutdownService.name);
  private isShuttingDown = false;
  private shutdownTimeout: number;
  private queueDrainTimeout: number;
  private websocketCloseTimeout: number;

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly schedulerRegistry?: SchedulerRegistry,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
  ) {
    this.shutdownTimeout =
      this.configService.get<number>('SHUTDOWN_TIMEOUT') || 30000;
    this.queueDrainTimeout =
      this.configService.get<number>('QUEUE_DRAIN_TIMEOUT') || 20000;
    this.websocketCloseTimeout =
      this.configService.get<number>('WEBSOCKET_CLOSE_TIMEOUT') || 5000;
  }

  onModuleInit() {
    // Register signal handlers for graceful shutdown
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));

    this.logger.log(
      `Graceful shutdown handlers registered (timeout: ${this.shutdownTimeout}ms)`,
    );
  }

  /**
   * Returns current shutdown state for health check integration
   */
  getShutdownState(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Main shutdown orchestrator
   * Coordinates shutdown sequence across all infrastructure components
   */
  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn(
        `Shutdown already in progress, ignoring ${signal} signal`,
      );
      return;
    }

    this.isShuttingDown = true;
    const startTime = Date.now();
    this.logger.log(
      `Received ${signal}, starting graceful shutdown (timeout: ${this.shutdownTimeout}ms)...`,
    );

    try {
      // Create shutdown timeout to force exit if graceful shutdown hangs
      const shutdownTimeoutHandle = setTimeout(() => {
        this.logger.error(
          `Graceful shutdown timed out after ${this.shutdownTimeout}ms, forcing exit`,
        );
        process.exit(1);
      }, this.shutdownTimeout);

      // Execute shutdown sequence
      await this.executeShutdownSequence();

      // Clear timeout since we completed successfully
      clearTimeout(shutdownTimeoutHandle);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Graceful shutdown completed successfully in ${duration}ms`,
      );
      process.exit(0);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Graceful shutdown failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      process.exit(1);
    }
  }

  /**
   * Execute coordinated shutdown sequence
   * Order matters: close ingress first, then drain workloads, then close connections
   */
  private async executeShutdownSequence(): Promise<void> {
    // Step 1: Health checks now fail (handled by getShutdownState())
    this.logger.log('Health readiness checks will now fail');

    // Step 2: Close WebSocket connections (notify clients first)
    await this.closeWebSockets();

    // Step 3: Stop scheduled tasks (prevent new work from starting)
    await this.stopScheduledTasks();

    // Step 4: Drain queue jobs (wait for active jobs to complete)
    await this.drainQueues();

    // Step 5: Close Redis cache connection
    await this.closeCacheConnections();

    // Step 6: Close Prisma DB connection (handled by PrismaService.onModuleDestroy)
    this.logger.log(
      'Database connections will be closed by PrismaService.onModuleDestroy',
    );
  }

  /**
   * Gracefully close all WebSocket connections
   */
  private async closeWebSockets(): Promise<void> {
    this.logger.log('Closing WebSocket connections...');

    try {
      const gateway = (global as any).websocketGateway as
        | ShutdownCapableWebsocketGateway
        | undefined;

      if (gateway && typeof gateway.gracefulShutdown === 'function') {
        await Promise.race([
          gateway.gracefulShutdown(this.websocketCloseTimeout),
          new Promise((resolve) =>
            setTimeout(resolve, this.websocketCloseTimeout),
          ),
        ]);
        this.logger.log('WebSocket connections closed');
      } else {
        this.logger.log('No active WebSocket connections to close');
      }
    } catch (error) {
      this.logger.warn(
        `Failed to close WebSocket connections: ${error.message}`,
      );
    }
  }

  /**
   * Stop all scheduled tasks (cron jobs, intervals, timeouts)
   */
  private async stopScheduledTasks(): Promise<void> {
    if (!this.schedulerRegistry) {
      this.logger.log('No SchedulerRegistry available, skipping task cleanup');
      return;
    }
    const schedulerRegistry = this.schedulerRegistry;

    this.logger.log('Stopping scheduled tasks...');

    try {
      // Stop all cron jobs
      const cronJobs = schedulerRegistry.getCronJobs();
      cronJobs.forEach((job, name) => {
        job.stop();
        this.logger.log(`Stopped cron job: ${name}`);
      });

      // Clear all intervals
      const intervals = schedulerRegistry.getIntervals();
      intervals.forEach((name) => {
        schedulerRegistry.deleteInterval(name);
        this.logger.log(`Cleared interval: ${name}`);
      });

      // Clear all timeouts
      const timeouts = schedulerRegistry.getTimeouts();
      timeouts.forEach((name) => {
        schedulerRegistry.deleteTimeout(name);
        this.logger.log(`Cleared timeout: ${name}`);
      });

      this.logger.log('All scheduled tasks stopped');
    } catch (error) {
      this.logger.warn(`Failed to stop scheduled tasks: ${error.message}`);
    }
  }

  /**
   * Drain Bull queue jobs (wait for active jobs to complete)
   */
  private async drainQueues(): Promise<void> {
    this.logger.log('Draining Bull queues...');

    // QueueService.onModuleDestroy will be called automatically by NestJS.
    this.logger.log(
      'Queue draining will be handled by QueueService.onModuleDestroy',
    );
  }

  /**
   * Close Redis cache connections
   */
  private async closeCacheConnections(): Promise<void> {
    if (!this.cacheManager) {
      this.logger.log('No cache manager available, skipping cache cleanup');
      return;
    }

    this.logger.log('Closing Redis cache connection...');

    try {
      await this.cacheManager.disconnect();
      this.logger.log('Redis cache connection closed');
    } catch (error) {
      this.logger.warn(
        `Failed to close cache connections: ${error.message}`,
      );
    }
  }
}
