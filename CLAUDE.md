# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS 11 production boilerplate with domain-oriented architecture, JWT authentication, RBAC, Prisma ORM, Redis caching, Bull queue processing, and comprehensive observability.

## Development Commands

### Initial Setup
```bash
pnpm setup                    # Full setup: install + prisma generate + migrate + seed
pnpm docker:up                # Start infrastructure (PostgreSQL, Redis, Prometheus, Grafana)
pnpm dev                      # Combined: docker:up + start:dev
```

### Database Operations
```bash
pnpm prisma:generate          # Generate Prisma client (required after schema changes)
pnpm prisma:migrate           # Create and apply migration
pnpm prisma:seed              # Seed database with test users
pnpm prisma:studio            # Open Prisma Studio GUI
pnpm db:reset                 # Reset and reseed database
```

### Development
```bash
pnpm start:dev                # Watch mode
pnpm start:debug              # Debug mode with inspector
pnpm build                    # Production build
pnpm start:prod               # Run production build
```

### Testing
```bash
pnpm test                     # Unit tests (*.spec.ts files next to source)
pnpm test:watch               # Watch mode
pnpm test:cov                 # With coverage report
pnpm test:e2e                 # E2E tests (test/e2e/*)
```

### Code Quality
```bash
pnpm lint                     # ESLint with auto-fix
pnpm format                   # Prettier format all files
```

## Architecture

### Module Hierarchy

The application follows a layered architecture with clear separation of concerns:

1. **AppModule** (src/app.module.ts) - Root module importing:
   - **CoreModule** - Cross-cutting concerns (guards, interceptors, filters, middlewares)
   - **InfraModule** - Infrastructure adapters (Prisma, Cache, Queue, Events, Schedule, Health, Metrics)
   - **DomainsModule** - Business domains (User, Auth, FeatureFlag)

### TypeScript Path Aliases

Use these path aliases consistently (defined in tsconfig.json):
- `@app/*` → `src/app/*`
- `@core/*` → `src/core/*`
- `@shared/*` → `src/shared/*`
- `@infra/*` → `src/infra/*`
- `@domains/*` → `src/domains/*`
- `@config/*` → `src/config/*`

### Domain Structure (DDD-inspired)

Each domain follows a 4-layer architecture:

```
src/domains/<domain-name>/
├── application/          # Application services (use cases)
├── domain/              # Business logic, entities, ports, events
│   ├── ports/           # Interfaces for external dependencies
│   ├── events/          # Domain events
│   └── types/           # Domain types
├── infrastructure/      # External adapters (repositories, strategies)
└── presentation/        # Controllers, DTOs
```

**Key Pattern:** Domains expose public APIs through `index.ts` files. Always import from `@domains/<name>` rather than deep imports (e.g., `@domains/user` not `@domains/user/application/user.service`).

**Ports Pattern:** Domains define ports (interfaces) in `domain/ports/` and register them in the module providers using injection tokens (e.g., `USER_READER_PORT`). This enables loose coupling and dependency inversion.

### Core Module Responsibilities

- **Guards:** JWT authentication (`JwtAuthGuard`), role-based authorization (`RolesGuard`), rate limiting (`ThrottlerGuard`)
- **Interceptors:** Response transformation, metrics collection, audit logging
- **Filters:** Global exception handling
- **Middlewares:** Request ID generation, idempotency key handling
- All guards/interceptors are registered globally via `APP_GUARD`/`APP_INTERCEPTOR` providers

### Infra Module Responsibilities

Infrastructure adapters that should NOT contain business logic:
- **Prisma:** Database access layer
- **Cache:** Redis caching
- **Queue:** Bull queue processing with Bull Board UI
- **Events:** EventEmitter2 for domain events
- **Schedule:** Cron jobs
- **Health/Metrics:** Health checks and Prometheus metrics
- **Upload/Streaming/WebSocket/Audit:** Feature-specific infrastructure

## API Routing

- **Global prefix:** `/api`
- **Versioning:** URI-based (`/v1/...`)
- **Main API base:** `/api/v1`
- **Exceptions (kept at root):** `/v1/health/*`, `/metrics`, `/admin/queues`

Controllers should use `@Controller({ path: 'resource', version: '1' })` for versioned endpoints.

## Authentication & Authorization

- JWT-based with access/refresh token pattern
- Guards applied globally in CoreModule
- Use `@Public()` decorator to skip JWT auth on specific endpoints
- Use `@Roles(Role.ADMIN)` decorator for role-based access control
- Seeded test accounts:
  - Admin: `admin@example.com` / `Admin123!`
  - User: `user@example.com` / `User123!`

## Database (Prisma)

- Schema: `prisma/schema.prisma`
- After schema changes: `pnpm prisma:generate` then `pnpm prisma:migrate`
- Models: User, RefreshToken, AuditLog, FeatureFlag, IdempotencyKey
- Use PrismaService (`@infra/prisma`) for all database operations
- Sensitive fields (e.g., `phone`) are encrypted via CryptoService before storage

## Testing Strategy

- **Unit tests:** Co-located with source files (`*.spec.ts`)
- **E2E tests:** Domain-grouped under `test/e2e/<domain>/`
- E2E tests use separate Jest config: `test/jest-e2e.json`
- Test support utilities in `test/e2e/support/`

## Important Patterns

### Domain Events
Domains emit events (e.g., `UserCreatedEvent`, `UserLoginEvent`) which are handled by event listeners. Events are defined in `domain/events/` and dispatched via `EventEmitter2`.

### Idempotency
The `IdempotencyMiddleware` prevents duplicate requests using the `Idempotency-Key` header. Cached responses are stored in the `IdempotencyKey` model.

### Request Tracing
Every request gets a `X-Request-ID` header via `RequestIdMiddleware`. Use this for correlating logs and debugging.

### Validation
Global ValidationPipe is configured with:
- `whitelist: true` - Strip unknown properties
- `forbidNonWhitelisted: true` - Throw error on unknown properties
- `transform: true` - Auto-transform payloads to DTO instances

### Swagger Documentation
Available at `/api-docs` when running. Use decorators like `@ApiOperation()`, `@ApiResponse()`, `@ApiBearerAuth('JWT-auth')` for documentation.

### Graceful Shutdown
`ShutdownService` (`src/infra/shutdown`) coordinates graceful shutdown across all infrastructure:
- Handles SIGTERM/SIGINT signals automatically
- Drains Bull queues (waits for active jobs to complete)
- Closes Redis cache, Prisma DB, and WebSocket connections
- Stops all scheduled tasks (cron jobs, intervals, timeouts)
- Updates health readiness probe to fail during shutdown

**DO NOT** disable shutdown hooks or skip `OnModuleDestroy` implementations. Infrastructure services should implement `OnModuleDestroy` to clean up resources properly.

## Environment Configuration

- Config files in `src/config/*.config.ts` (database, redis, jwt, bull)
- Validation: `src/config/env.validation.ts` validates required env vars on startup
- Access via `ConfigService` (injected from `@nestjs/config`)
- See `.env.example` for all available variables (note: access denied, refer to README)

## Common Tasks

### Adding a New Domain
1. Create domain folder structure: `src/domains/<name>/{application,domain,infrastructure,presentation}`
2. Create domain module extending the 4-layer pattern
3. Export public API through `index.ts`
4. Import in `DomainsModule` (`src/domains/domains.module.ts`)

### Adding a New Migration
```bash
# Make changes to prisma/schema.prisma
pnpm prisma:generate
pnpm prisma:migrate    # Name your migration when prompted
```

### Adding Global Middleware/Guard/Interceptor
Register in `CoreModule` using `APP_*` providers (see `src/core/core.module.ts` for examples).

## Local Services

When running locally:
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api-docs
- Health: http://localhost:3000/v1/health/live
- Metrics: http://localhost:3000/metrics
- Bull Board: http://localhost:3000/admin/queues
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
