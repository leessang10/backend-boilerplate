import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(
    @InjectMetric('http_requests_total') private httpRequestsCounter: Counter,
    @InjectMetric('http_request_duration_seconds')
    private httpDurationHistogram: Histogram,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const route = request.route?.path || request.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const status = response.statusCode;
          const duration = (Date.now() - startTime) / 1000;

          // Increment request counter
          this.httpRequestsCounter.inc({
            method,
            route,
            status,
          });

          // Record request duration
          this.httpDurationHistogram.observe(
            {
              method,
              route,
              status,
            },
            duration,
          );
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;
          const status = error.status || 500;

          // Increment request counter for errors
          this.httpRequestsCounter.inc({
            method,
            route,
            status,
          });

          // Record request duration for errors
          this.httpDurationHistogram.observe(
            {
              method,
              route,
              status,
            },
            duration,
          );
        },
      }),
    );
  }
}
