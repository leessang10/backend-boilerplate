import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@shared/interfaces/response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers['x-request-id'];
    const requestPath = request.path ?? request.url ?? '';
    const normalizedPath = String(requestPath).split('?')[0];

    // Prometheus expects plain text exposition format; wrapping it in JSON breaks scraping.
    if (
      request.method === 'GET' &&
      /^\/(?:api\/)?metrics(?:\/.*)?$/.test(normalizedPath)
    ) {
      return next.handle() as Observable<ApiResponse<T>>;
    }

    return next.handle().pipe(
      map((data) => {
        // If data is already in ApiResponse format, return it
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Transform to standard ApiResponse format
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          requestId,
        };
      }),
    );
  }
}
