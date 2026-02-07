import { NestFactory } from '@nestjs/core';
import { RequestMethod, VERSION_NEUTRAL, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { RequestIdMiddleware } from './core/middlewares/request-id.middleware';
import { IdempotencyMiddleware } from './core/middlewares/idempotency.middleware';
import { PrismaService } from './infra/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Apply request ID middleware
  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((req, res, next) => requestIdMiddleware.use(req, res, next));

  // Apply idempotency middleware
  const prismaService = app.get(PrismaService);
  const idempotencyMiddleware = new IdempotencyMiddleware(prismaService);
  app.use((req, res, next) => idempotencyMiddleware.use(req, res, next));

  // Get ConfigService
  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 3000);
  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000').split(',');

  // Use Pino logger
  app.useLogger(app.get(Logger));

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key'],
    exposedHeaders: ['X-Request-ID'],
  });

  // API Versioning (URI-based)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });

  // Global prefix (exclude infra endpoints that should stay at root)

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'metrics', method: RequestMethod.ALL },
      { path: 'metrics/(.*)', method: RequestMethod.ALL },
      { path: 'admin/queues', method: RequestMethod.ALL },
      { path: 'admin/queues/(.*)', method: RequestMethod.ALL },
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/(.*)', method: RequestMethod.ALL },
      { path: 'v1/health', method: RequestMethod.ALL },
      { path: 'v1/health/(.*)', method: RequestMethod.ALL },
    ],
  });

  // Global pipes
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

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Production Boilerplate API')
    .setDescription('Production-ready NestJS API with authentication, authorization, and monitoring')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port);

  const apiBaseUrl = `http://localhost:${port}/api`;
  console.log(`🚀 Application is running on: ${apiBaseUrl}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`💚 Health Check: http://localhost:${port}/v1/health`);
  console.log(`🧰 Bull Board: http://localhost:${port}/admin/queues`);
  console.log(`📈 Prometheus: http://localhost:${port}/metrics`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
