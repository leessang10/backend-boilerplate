import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'staging'])
    .default('development'),
  PORT: z.string().default('3000').transform(Number).pipe(z.number().positive()),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number).pipe(z.number().positive()),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number).pipe(z.number().min(0)),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // Encryption
  ENCRYPTION_KEY: z.string().length(32, 'Encryption key must be exactly 32 bytes'),

  // Rate Limiting
  THROTTLE_TTL: z.string().default('60').transform(Number).pipe(z.number().positive()),
  THROTTLE_LIMIT: z.string().default('10').transform(Number).pipe(z.number().positive()),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // File Upload
  UPLOAD_MAX_FILE_SIZE: z.string().default('10485760').transform(Number).pipe(z.number().positive()),
  UPLOAD_DEST: z.string().default('./uploads'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Bull Queue
  BULL_BOARD_PATH: z.string().default('/admin/queues'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
