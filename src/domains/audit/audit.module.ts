import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditController } from './presentation/audit.controller';
import { AuditService } from './application/audit.service';
import { AuditInterceptor } from '@core/interceptors/audit.interceptor';
import { AuditLogRepository } from './infrastructure/audit-log.repository';
import { AUDIT_LOG_REPOSITORY_PORT } from './domain/ports/audit-log.repository.port';

@Module({
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditLogRepository,
    {
      provide: AUDIT_LOG_REPOSITORY_PORT,
      useExisting: AuditLogRepository,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
