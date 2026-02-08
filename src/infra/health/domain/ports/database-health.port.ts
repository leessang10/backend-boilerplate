import { HealthIndicatorResult } from '@nestjs/terminus';

export const DATABASE_HEALTH_PORT = Symbol('DATABASE_HEALTH_PORT');

export interface DatabaseHealthPort {
  check(name: string): Promise<HealthIndicatorResult>;
}
