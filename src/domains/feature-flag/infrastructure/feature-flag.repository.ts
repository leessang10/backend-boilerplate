import { Injectable } from '@nestjs/common';
import { FeatureFlag } from '@prisma/client';
import { PrismaService } from '@infra/prisma/prisma.service';
import {
  CreateFeatureFlagInput,
  FeatureFlagRepositoryPort,
} from '../domain/ports/feature-flag-repository.port';

@Injectable()
export class FeatureFlagRepository implements FeatureFlagRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findByKey(key: string): Promise<FeatureFlag | null> {
    return this.prisma.featureFlag.findUnique({
      where: { key },
    });
  }

  findAll(): Promise<FeatureFlag[]> {
    return this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
  }

  create(input: CreateFeatureFlagInput): Promise<FeatureFlag> {
    return this.prisma.featureFlag.create({
      data: input,
    });
  }

  async upsertEnabled(key: string, enabled: boolean): Promise<void> {
    await this.prisma.featureFlag.upsert({
      where: { key },
      update: { enabled },
      create: {
        key,
        name: key,
        description: `Feature flag for ${key}`,
        enabled,
      },
    });
  }

  async updateEnabled(key: string, enabled: boolean): Promise<void> {
    await this.prisma.featureFlag.update({
      where: { key },
      data: { enabled },
    });
  }

  async deleteByKey(key: string): Promise<void> {
    await this.prisma.featureFlag.delete({
      where: { key },
    });
  }
}
