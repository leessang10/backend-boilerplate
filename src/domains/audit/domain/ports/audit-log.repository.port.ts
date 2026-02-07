import { AuditLog, Prisma } from '@prisma/client';

export const AUDIT_LOG_REPOSITORY_PORT = Symbol('AUDIT_LOG_REPOSITORY_PORT');

export type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
      };
    };
  };
}>;

export interface AuditLogRepositoryPort {
  count(where: Prisma.AuditLogWhereInput): Promise<number>;
  findMany(
    where: Prisma.AuditLogWhereInput,
    skip: number,
    take: number,
  ): Promise<AuditLogWithUser[]>;
  findById(id: string): Promise<AuditLogWithUser | null>;
  findByUser(userId: string): Promise<AuditLog[]>;
}
