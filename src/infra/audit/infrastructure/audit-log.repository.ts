import { Injectable } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import {
  AuditLogRepositoryPort,
  AuditLogWithUser,
} from '../domain/ports/audit-log.repository.port';
import { PrismaService } from '@infra/prisma/prisma.service';

@Injectable()
export class AuditLogRepository implements AuditLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.AuditLogWhereInput): Promise<number> {
    return this.prisma.auditLog.count({ where });
  }

  findMany(
    where: Prisma.AuditLogWhereInput,
    skip: number,
    take: number,
  ): Promise<AuditLogWithUser[]> {
    return this.prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  findById(id: string): Promise<AuditLogWithUser | null> {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  findByUser(userId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
