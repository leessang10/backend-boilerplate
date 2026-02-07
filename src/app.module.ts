import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { RolesGuard } from './core/guards/roles.guard';
import { MetricsInterceptor } from './core/interceptors/metrics.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infra/prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { CacheModule } from './infra/cache/cache.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './modules/upload/upload.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { AuditModule } from './modules/audit/audit.module';
import { FeatureFlagModule } from './modules/feature-flag/feature-flag.module';
import { QueueModule } from './infra/queue/queue.module';
import { BullBoardFeatureModule } from './infra/queue/bull-board.module';
import { EventsModule } from './infra/events/events.module';
import { ScheduleModule } from './infra/schedule/schedule.module';
import { validateEnv } from './config/env.validation';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
      load: [databaseConfig, redisConfig, jwtConfig],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
      },
    ]),

    // Logger
    LoggerModule,

    // Database
    PrismaModule,

    // Cache
    CacheModule,

    // Crypto
    CryptoModule,

    // Queue & Events & Schedule
    QueueModule,
    BullBoardFeatureModule,
    EventsModule,
    ScheduleModule,

    // Modules
    UserModule,
    AuthModule,
    HealthModule,
    UploadModule,
    StreamingModule,
    WebsocketModule,
    MetricsModule,
    AuditModule,
    FeatureFlagModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    // Global guards (order matters: throttle -> jwt -> roles)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
