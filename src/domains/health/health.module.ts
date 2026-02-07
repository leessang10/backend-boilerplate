import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './presentation/health.controller';
import { DATABASE_HEALTH_PORT } from './domain/ports/database-health.port';
import { PrismaDatabaseHealthAdapter } from './infrastructure/prisma-database-health.adapter';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    PrismaDatabaseHealthAdapter,
    {
      provide: DATABASE_HEALTH_PORT,
      useExisting: PrismaDatabaseHealthAdapter,
    },
  ],
})
export class HealthModule {}
