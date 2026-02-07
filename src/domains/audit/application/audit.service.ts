import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationMeta } from '../../../shared/interfaces/response.interface';
import { AUDIT_LOG_REPOSITORY_PORT } from '../domain/ports/audit-log.repository.port';
import type { AuditLogRepositoryPort } from '../domain/ports/audit-log.repository.port';

interface QueryAuditDto {
  page: number;
  limit: number;
  userId?: string;
  action?: string;
  entity?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY_PORT)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {}

  async findAll(query: QueryAuditDto) {
    const { page = 1, limit = 50, userId, action, entity } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    const total = await this.auditLogRepository.count(where);
    const logs = await this.auditLogRepository.findMany(where, skip, limit);

    // Build pagination meta
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      data: logs,
      meta,
    };
  }

  async findOne(id: string) {
    const log = await this.auditLogRepository.findById(id);

    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    return log;
  }

  async findByUser(userId: string) {
    return this.auditLogRepository.findByUser(userId);
  }
}
