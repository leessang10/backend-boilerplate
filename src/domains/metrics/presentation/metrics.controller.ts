import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../shared/decorators/public.decorator';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

@ApiTags('Metrics')
@Controller({ path: 'metrics', version: '1' })
export class MetricsController {
  constructor(
    @InjectMetric('http_requests_total') private httpRequestsCounter: Counter,
    @InjectMetric('users_registered_total')
    private usersRegisteredCounter: Counter,
    @InjectMetric('login_attempts_total') private loginAttemptsCounter: Counter,
  ) {}

  @Get('info')
  @Public()
  @ApiOperation({ summary: 'Get metrics information' })
  getMetricsInfo() {
    return {
      message: 'Prometheus metrics are available at /metrics endpoint',
      metrics: {
        httpRequests: 'http_requests_total - Total HTTP requests',
        httpDuration: 'http_request_duration_seconds - HTTP request duration',
        usersRegistered: 'users_registered_total - Total users registered',
        loginAttempts: 'login_attempts_total - Total login attempts',
        queueJobs: 'queue_jobs_total - Total queue jobs',
        websocketConnections:
          'websocket_connections_total - Total WebSocket connections',
      },
      defaultMetrics: [
        'nodejs_version_info',
        'nodejs_heap_size_total_bytes',
        'nodejs_heap_size_used_bytes',
        'nodejs_external_memory_bytes',
        'nodejs_heap_space_size_total_bytes',
        'nodejs_heap_space_size_used_bytes',
        'nodejs_heap_space_size_available_bytes',
        'process_cpu_user_seconds_total',
        'process_cpu_system_seconds_total',
        'process_cpu_seconds_total',
        'process_start_time_seconds',
        'process_resident_memory_bytes',
      ],
    };
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get current application statistics' })
  getStats() {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };
  }
}
