import { Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: 'metrics',
      defaultLabels: {
        app: 'backend-boilerplate',
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [
    // HTTP request counter
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    }),
    // HTTP request duration histogram
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5],
    }),
    // User registration counter
    makeCounterProvider({
      name: 'users_registered_total',
      help: 'Total number of users registered',
    }),
    // Login attempts counter
    makeCounterProvider({
      name: 'login_attempts_total',
      help: 'Total number of login attempts',
      labelNames: ['status'],
    }),
    // Queue jobs counter
    makeCounterProvider({
      name: 'queue_jobs_total',
      help: 'Total number of queue jobs processed',
      labelNames: ['queue', 'status'],
    }),
    // WebSocket connections gauge
    makeCounterProvider({
      name: 'websocket_connections_total',
      help: 'Total number of WebSocket connections',
      labelNames: ['event'],
    }),
  ],
  exports: [PrometheusModule],
})
export class MetricsModule {}
