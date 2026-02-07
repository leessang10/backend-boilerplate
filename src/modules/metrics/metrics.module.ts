import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';

const metricsProviders = [
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
  // Queue jobs completed
  makeCounterProvider({
    name: 'queue_jobs_completed_total',
    help: 'Total number of queue jobs completed successfully',
    labelNames: ['queue'],
  }),
  // Queue jobs failed
  makeCounterProvider({
    name: 'queue_jobs_failed_total',
    help: 'Total number of queue jobs failed',
    labelNames: ['queue'],
  }),
  // WebSocket connections gauge
  makeGaugeProvider({
    name: 'websocket_connections_total',
    help: 'Current number of active WebSocket connections',
    labelNames: ['gateway'],
  }),
];

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
  providers: metricsProviders,
  exports: [PrometheusModule, ...metricsProviders],
})
export class MetricsModule {}
