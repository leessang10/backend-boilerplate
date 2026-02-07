import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { parse } from 'node:path';
import { Public } from '../../../shared/decorators/public.decorator';
import { DATABASE_HEALTH_PORT } from '../domain/ports/database-health.port';
import type { DatabaseHealthPort } from '../domain/ports/database-health.port';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  private readonly diskCheckPath = parse(process.cwd()).root;

  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    @Inject(DATABASE_HEALTH_PORT)
    private readonly databaseHealth: DatabaseHealthPort,
  ) {}

  @Public()
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.databaseHealth.check('database')]);
  }

  @Public()
  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('/')
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health
      () => this.databaseHealth.check('database'),

      // Memory heap check (should not exceed 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Memory RSS check (should not exceed 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // Disk health check (should have at least 50% free space)
      () =>
        this.disk.checkStorage('storage', {
          path: this.diskCheckPath,
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
