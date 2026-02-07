import { FeatureFlag } from '@prisma/client';

export interface CreateFeatureFlagInput {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
}

export const FEATURE_FLAG_REPOSITORY_PORT = Symbol(
  'FEATURE_FLAG_REPOSITORY_PORT',
);

export interface FeatureFlagRepositoryPort {
  findByKey(key: string): Promise<FeatureFlag | null>;
  findAll(): Promise<FeatureFlag[]>;
  create(input: CreateFeatureFlagInput): Promise<FeatureFlag>;
  upsertEnabled(key: string, enabled: boolean): Promise<void>;
  updateEnabled(key: string, enabled: boolean): Promise<void>;
  deleteByKey(key: string): Promise<void>;
}
