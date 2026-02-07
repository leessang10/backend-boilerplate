# NestJS Production Boilerplate

Production-ready NestJS 11 boilerplate with authentication, RBAC, Prisma, Redis, queue processing, metrics, and domain-oriented structure.

## Overview

This project is designed for backend teams that want:

- Domain-oriented module structure (`src/domains/*`)
- Clear cross-cutting separation (`src/core`)
- Shared reusable components (`src/shared`)
- Infra adapters for DB/cache/queue/events/scheduling (`src/infra`)
- Built-in observability (Prometheus, health checks, structured logging)

## Key Features

- JWT auth (access/refresh) with role-based authorization
- Prisma + PostgreSQL integration
- Redis cache support
- Bull queue + Bull Board
- Health endpoints (readiness/liveness)
- Prometheus metrics + Grafana dashboard support
- Swagger API docs
- Request ID + idempotency middleware
- Global validation/filter/interceptor setup

## Runtime Routing

- Global prefix: `/api`
- Versioning: URI versioning (`/v1/...`)
- Main API base: `/api/v1`

Exceptions (kept at root):

- `/v1/health/*`
- `/metrics`
- `/admin/queues`

## Project Structure

```text
src/
  app/
    app.module.ts
  core/
    guards/
    interceptors/
    filters/
    middlewares/
  shared/
    crypto/
    decorators/
    logger/
    constants/
    interfaces/
    utils/
  infra/
    prisma/
    cache/
    queue/
    events/
    schedule/
  domains/
    auth/
    user/
    health/
    metrics/
    audit/
    feature-flag/
    upload/
    streaming/
    websocket/
  main.ts

test/
  e2e/
    auth/
    user/
    health/
    metrics/
    support/
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker + Docker Compose (recommended for local infra)

### Setup

1. Install dependencies

```bash
pnpm install
```

2. Create env file

```bash
cp .env.example .env
```

3. Start local infra (PostgreSQL, Redis, monitoring stack)

```bash
docker-compose up -d
```

4. Prisma generate/migrate/seed

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

5. Run server

```bash
pnpm start:dev
```

### Local URLs

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api-docs`
- Health: `http://localhost:3000/v1/health/live`
- Metrics: `http://localhost:3000/metrics`
- Bull Board: `http://localhost:3000/admin/queues`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001` (`admin/admin`)

### Seeded Accounts

- Admin: `admin@example.com` / `Admin123!`
- User: `user@example.com` / `User123!`

## Scripts

```bash
# app
pnpm start
pnpm start:dev
pnpm start:debug
pnpm build
pnpm start:prod

# quality
pnpm lint
pnpm format

# tests
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:e2e

# prisma
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:migrate:prod
pnpm prisma:seed
pnpm prisma:studio
```

## Testing Notes

- Unit tests live next to source (`*.spec.ts`)
- E2E tests are domain-grouped under `test/e2e/*`
- E2E config: `test/jest-e2e.json`

E2E smoke coverage currently includes:

- `auth`: invalid payload validation
- `user`: auth required check
- `health`: liveness endpoint
- `metrics`: info endpoint

## API Summary

### Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### User

- `GET /api/v1/users/me`
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`
- `DELETE /api/v1/users/:id`

### Health and Metrics

- `GET /v1/health`
- `GET /v1/health/ready`
- `GET /v1/health/live`
- `GET /metrics`
- `GET /v1/metrics/info`

## Environment Variables

See `.env.example` for full list.

Important keys:

- `DATABASE_URL`
- `REDIS_HOST`, `REDIS_PORT`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY`
- `THROTTLE_TTL`, `THROTTLE_LIMIT`
- `UPLOAD_DEST`, `UPLOAD_MAX_FILE_SIZE`

## Architecture and Boundaries

- Use domain public APIs (`@domains/<name>`) rather than deep imports.
- Domain `application/domain/presentation` layers should not directly depend on infra implementations.
- Infra dependencies are introduced through adapters/ports where needed.

## License

UNLICENSED
