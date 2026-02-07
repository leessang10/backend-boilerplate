import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, PrismaHealthIndicator } from '@nestjs/terminus';
import { DatabaseHealthPort } from '../domain/ports/database-health.port';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class PrismaDatabaseHealthAdapter implements DatabaseHealthPort {
  constructor(
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  check(name: string): Promise<HealthIndicatorResult> {
    return this.prismaHealth.pingCheck(name, this.prisma);
  }
}
