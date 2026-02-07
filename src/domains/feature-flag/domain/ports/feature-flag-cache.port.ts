export const FEATURE_FLAG_CACHE_PORT = Symbol('FEATURE_FLAG_CACHE_PORT');

export interface FeatureFlagCachePort {
  get(key: string): Promise<boolean | undefined>;
  set(key: string, enabled: boolean, ttlMs: number): Promise<void>;
  del(key: string): Promise<void>;
}
