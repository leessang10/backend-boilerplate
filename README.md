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

1. Create env file

```bash
cp .env.example .env
```

2. Full setup (install + prisma + docker)

```bash
pnpm setup
pnpm docker:up
```

3. Run server

```bash
pnpm start:dev
```

Or use the combined command:

```bash
pnpm dev
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
# initial setup
pnpm setup                    # full setup: install + prisma generate + migrate + seed
pnpm db:setup                 # db setup: generate + migrate + seed
pnpm db:reset                 # reset db and reseed

# docker (local infrastructure)
pnpm docker:up                # start postgres, redis, prometheus, grafana
pnpm docker:down              # stop all containers
pnpm docker:logs              # follow logs
pnpm docker:restart           # restart containers
pnpm docker:clean             # stop and remove volumes

# app
pnpm dev                      # docker:up + start:dev
pnpm start                    # production start
pnpm start:dev                # watch mode
pnpm start:debug              # debug mode
pnpm build                    # build for production
pnpm start:prod               # run production build
pnpm clean                    # remove dist, coverage, .nest

# quality
pnpm lint                     # eslint with auto-fix
pnpm format                   # prettier format

# tests
pnpm test                     # unit tests
pnpm test:watch               # watch mode
pnpm test:cov                 # with coverage
pnpm test:e2e                 # e2e tests

# prisma
pnpm prisma:generate          # generate prisma client
pnpm prisma:migrate           # create and apply migration
pnpm prisma:migrate:prod      # apply migrations (production)
pnpm prisma:push              # push schema without migration (dev only)
pnpm prisma:seed              # seed database
pnpm prisma:studio            # open prisma studio
pnpm prisma:reset             # reset database
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

## Production Deployment

### Graceful Shutdown

The application implements graceful shutdown for zero-downtime deployments:

- **Signal Handling**: Responds to SIGTERM/SIGINT (Kubernetes/Docker)
- **Queue Draining**: Waits for active Bull jobs to complete (20s timeout)
- **Connection Cleanup**: Closes WebSocket, Redis, and database connections
- **Health Checks**: Readiness probe fails immediately on shutdown
- **Timeout Protection**: Forces exit after 30 seconds

**Configuration:**

```env
SHUTDOWN_TIMEOUT=30000          # Total shutdown timeout (ms)
QUEUE_DRAIN_TIMEOUT=20000       # Queue job completion timeout (ms)
WEBSOCKET_CLOSE_TIMEOUT=5000    # WebSocket close timeout (ms)
```

**Kubernetes Configuration:**

Set `terminationGracePeriodSeconds: 35` (5s buffer over timeout):

```yaml
spec:
  terminationGracePeriodSeconds: 35
  containers:
  - name: app
    env:
    - name: SHUTDOWN_TIMEOUT
      value: "30000"
    livenessProbe:
      httpGet:
        path: /v1/health/live
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /v1/health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 2
```

**Docker:**

```bash
# Stop with grace period (default 10s, recommend 30s+)
docker stop --time=35 <container>
```

## Architecture and Boundaries

- Use domain public APIs (`@domains/<name>`) rather than deep imports.
- Domain `application/domain/presentation` layers should not directly depend on infra implementations.
- Infra dependencies are introduced through adapters/ports where needed.

## License

UNLICENSED
