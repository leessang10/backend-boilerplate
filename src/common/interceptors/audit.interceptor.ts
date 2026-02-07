import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

export const SKIP_AUDIT = 'skipAudit';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if audit should be skipped for this route
    const skipAudit = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipAudit) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const user = request.user;

    // Only audit CUD operations
    const shouldAudit = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!shouldAudit || !user) {
      return next.handle();
    }

    const action = this.getActionFromMethod(method);
    const entity = this.extractEntityFromUrl(url);

    return next.handle().pipe(
      tap({
        next: async (response) => {
          try {
            await this.createAuditLog({
              userId: user.id,
              action,
              entity,
              entityId: this.extractEntityId(response),
              metadata: {
                method,
                url,
                body: this.sanitizeRequestBody(request.body),
                userAgent: request.headers['user-agent'],
                ip: request.ip || request.connection.remoteAddress,
              },
              status: 'success',
            });
          } catch (error) {
            this.logger.error(`Failed to create audit log: ${error.message}`);
          }
        },
        error: async (error) => {
          try {
            await this.createAuditLog({
              userId: user.id,
              action,
              entity,
              entityId: null,
              metadata: {
                method,
                url,
                body: this.sanitizeRequestBody(request.body),
                error: error.message,
                userAgent: request.headers['user-agent'],
                ip: request.ip || request.connection.remoteAddress,
              },
              status: 'failure',
            });
          } catch (auditError) {
            this.logger.error(`Failed to create audit log: ${auditError.message}`);
          }
        },
      }),
    );
  }

  private async createAuditLog(data: {
    userId: string;
    action: string;
    entity: string;
    entityId: string | null;
    metadata: any;
    status: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        metadata: data.metadata as any,
        status: data.status,
      },
    });
  }

  private getActionFromMethod(method: string): string {
    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    return actionMap[method] || 'UNKNOWN';
  }

  private extractEntityFromUrl(url: string): string {
    // Extract entity name from URL
    // Example: /v1/users/123 -> users
    const parts = url.split('/').filter((p) => p && p !== 'v1');
    return parts[0] || 'unknown';
  }

  private extractEntityId(response: any): string | null {
    if (!response) return null;

    // Try to extract ID from response
    if (typeof response === 'object') {
      return response.id || response.data?.id || null;
    }

    return null;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return null;

    // Remove sensitive fields
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
