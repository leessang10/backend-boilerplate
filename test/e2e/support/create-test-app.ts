import {
  INestApplication,
  Module,
  RequestMethod,
  ValidationPipe,
  VERSION_NEUTRAL,
  VersioningType,
} from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { InfraModule } from '../../../src/infra/infra.module';
import { PrismaModule } from '../../../src/infra/prisma/prisma.module';
import { CacheModule } from '../../../src/infra/cache/cache.module';
import { ShutdownModule } from '../../../src/infra/shutdown/shutdown.module';
import { HealthModule } from '../../../src/infra/health/health.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    ShutdownModule,
    HealthModule,
    EventEmitterModule.forRoot(),
  ],
  exports: [PrismaModule, CacheModule, ShutdownModule, HealthModule, EventEmitterModule],
})
class TestInfraModule {}

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(InfraModule)
    .useModule(TestInfraModule)
    .compile();

  const app = moduleFixture.createNestApplication();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'metrics', method: RequestMethod.ALL },
      { path: 'metrics/*path', method: RequestMethod.ALL },
      { path: 'admin/queues', method: RequestMethod.ALL },
      { path: 'admin/queues/*path', method: RequestMethod.ALL },
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/*path', method: RequestMethod.ALL },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
  return app;
}

export async function closeTestApp(
  app: INestApplication | undefined,
): Promise<void> {
  if (!app) {
    return;
  }

  try {
    await app.close();
  } catch {
    // Bull worker teardown can throw in test environment.
  }
}
