import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MaskUtil } from '../utils/mask.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const requestId = headers['x-request-id'];

    const now = Date.now();

    // Log incoming request
    this.logger.log({
      type: 'REQUEST',
      requestId,
      method,
      url,
      body: MaskUtil.maskObject(body),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - now;

          this.logger.log({
            type: 'RESPONSE',
            requestId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - now;

          this.logger.error({
            type: 'ERROR',
            requestId,
            method,
            url,
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
          });
        },
      }),
    );
  }
}
