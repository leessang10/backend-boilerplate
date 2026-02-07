# NestJS Production Boilerplate - Features

## Overview

This is a comprehensive, production-ready NestJS boilerplate with all essential features for building scalable backend applications.

## Core Features

### 1. Authentication & Authorization ✅

- **JWT Authentication** with access and refresh tokens
- **Token Rotation** for enhanced security
- **Argon2** password hashing
- **Role-Based Access Control (RBAC)**
  - Roles: ADMIN, USER, MODERATOR
  - Global JWT and Roles guards
  - `@Public()` decorator to bypass authentication
  - `@Roles()` decorator for role-based access
  - `@CurrentUser()` decorator to access user info

### 2. User Management ✅

- Complete CRUD operations
- Password encryption with Argon2
- Sensitive data encryption (phone numbers) with AES-256-GCM
- Pagination, filtering, and sorting
- Admin-only endpoints for user management
- Profile management for authenticated users

### 3. Database & ORM ✅

- **Prisma ORM 7** with PostgreSQL
- Connection pooling
- Transaction helpers
- Migration system
- Seed scripts with admin and test users
- Models:
  - User
  - RefreshToken
  - AuditLog
  - FeatureFlag
  - IdempotencyKey

### 4. Caching ✅

- **Redis** integration
- Cache-manager with Redis store
- Configurable TTL
- Cache invalidation strategies

### 5. Message Queue ✅

- **BullMQ** for background job processing
- Multiple queue support (email, notification)
- Job retry with exponential backoff
- **Bull Board** UI for queue monitoring (`/admin/queues`)
- Dead Letter Queue (DLQ) handling
- Sample email processor

### 6. Domain Events ✅

- **EventEmitter2** for event-driven architecture
- User lifecycle events (created, updated, deleted, login, logout)
- Automatic email notifications via queue
- Extensible event handler system

### 7. Scheduled Tasks ✅

- **@nestjs/schedule** with cron jobs
- Distributed lock implementation using Redis
- Automatic cleanup tasks:
  - Expired refresh tokens (daily at 2 AM)
  - Old audit logs (weekly, 90+ days)
  - Expired idempotency keys (hourly)
- System health monitoring (every 5 minutes)
- Statistics logging (every 30 minutes)

### 8. File Upload & Storage ✅

- **Multer** for file uploads
- Local storage implementation
- S3 storage interface (stub for future implementation)
- File size and type validation
- Single and multiple file upload support
- File download endpoint

### 9. File Streaming & SSE ✅

- File download streaming
- Video streaming with range support (partial content)
- **Server-Sent Events (SSE)** for real-time updates
- Progress tracking endpoint
- Event stream examples

### 10. WebSocket ✅

- **Socket.io** integration
- JWT authentication for WebSocket connections
- Room/channel support
- Broadcasting and private messaging
- Typing indicators
- User join/leave notifications
- Connection management

### 11. Monitoring & Metrics ✅

- **Prometheus** integration
- Default Node.js metrics
- Custom business metrics:
  - HTTP request counter
  - HTTP request duration histogram
  - User registration counter
  - Login attempts counter
  - Queue jobs counter
  - WebSocket connections counter
- `/metrics` endpoint for Prometheus scraping
- Metrics info and statistics endpoints

### 12. Audit Logging ✅

- Automatic logging of CUD operations
- User action tracking
- Request metadata capture (IP, user agent)
- Success/failure status
- Sensitive data masking
- Admin-only audit log viewing
- `@SkipAudit()` decorator to exclude routes

### 13. Idempotency ✅

- Idempotency key middleware
- Redis-backed duplicate request prevention
- Automatic response caching for POST/PUT/PATCH
- 24-hour TTL for idempotency keys
- `Idempotency-Key` header support

### 14. Feature Flags ✅

- Runtime feature toggling
- Redis-cached flag state
- Admin-only flag management
- `@FeatureFlag()` decorator for route protection
- RESTful API for flag CRUD operations
- Enable/disable/toggle endpoints

### 15. Health Checks ✅

- **@nestjs/terminus** for health checks
- Database health check
- Memory usage check
- Disk usage check
- Separate endpoints:
  - `/v1/health` - Full health check
  - `/v1/health/ready` - Readiness probe (Kubernetes)
  - `/v1/health/live` - Liveness probe (Kubernetes)

### 16. API Documentation ✅

- **Swagger/OpenAPI 3** integration
- Auto-generated documentation
- JWT Bearer authentication UI
- Available at `/api-docs`
- DTO validation decorators
- API versioning support (URI-based: `/v1/`)

### 17. Logging ✅

- **Pino** structured logging
- Request ID tracking (UUID v4)
- Pretty printing in development
- JSON format in production
- Sensitive data masking
- Query logging in development

### 18. Security ✅

- **Helmet** middleware
- CORS configuration
- Rate limiting with **@nestjs/throttler**
- Input validation with **class-validator**
- Whitelist and forbid non-whitelisted properties
- Password strength requirements
- Encryption for sensitive data (AES-256-GCM)

### 19. Error Handling ✅

- Global exception filter
- Standardized error responses
- Error code enum
- Validation error formatting
- Request ID in error responses

### 20. Response Formatting ✅

- Transform interceptor
- Standardized API response format:
  ```json
  {
    "success": true,
    "data": {},
    "meta": {},
    "timestamp": "ISO 8601",
    "requestId": "uuid"
  }
  ```

### 21. Testing ✅

- E2E test suite
- Test cases for:
  - Authentication (login, refresh, logout)
  - User management (CRUD, pagination, search)
  - Health checks
- Jest configuration
- Test database setup

### 22. Docker & DevOps ✅

- Multi-stage Dockerfile
- Docker Compose with PostgreSQL and Redis
- Environment variable validation
- `.env.example` template

### 23. CI/CD ✅

- **GitHub Actions** workflows
- CI pipeline (lint, test, build)
- CD pipeline (Docker build, push, deploy)

### 24. Kubernetes ✅

- Deployment manifest with rolling update strategy
- Service, ConfigMap, Secret manifests
- PodDisruptionBudget for high availability
- Readiness and liveness probes
- Zero-downtime deployments (maxUnavailable: 0)

## API Endpoints

### Auth
- `POST /v1/auth/login` - Login
- `POST /v1/auth/refresh` - Refresh tokens
- `POST /v1/auth/logout` - Logout

### Users
- `GET /v1/users/me` - Get current user profile
- `GET /v1/users` - List users (Admin)
- `GET /v1/users/:id` - Get user by ID (Admin)
- `POST /v1/users` - Create user (Admin)
- `PATCH /v1/users/:id` - Update user (Admin)
- `DELETE /v1/users/:id` - Delete user (Admin)

### Upload
- `POST /v1/upload/single` - Upload single file
- `POST /v1/upload/multiple` - Upload multiple files
- `GET /v1/upload/:fileName` - Download file
- `DELETE /v1/upload/:fileName` - Delete file (Admin)

### Streaming
- `GET /v1/streaming/file/:fileName` - Stream file download
- `GET /v1/streaming/video/:fileName` - Stream video with range support
- `GET /v1/streaming/events` - SSE event stream (Public)
- `GET /v1/streaming/progress/:taskId` - Track task progress

### Health
- `GET /v1/health` - Full health check (Public)
- `GET /v1/health/ready` - Readiness probe (Public)
- `GET /v1/health/live` - Liveness probe (Public)

### Metrics
- `GET /metrics` - Prometheus metrics (Public)
- `GET /v1/metrics/info` - Metrics information (Public)
- `GET /v1/metrics/stats` - Application statistics (Public)

### Audit
- `GET /v1/audit` - Get audit logs (Admin)
- `GET /v1/audit/:id` - Get audit log by ID (Admin)
- `GET /v1/audit/user/:userId` - Get user audit logs (Admin)

### Feature Flags
- `GET /v1/feature-flags` - List all flags (Admin)
- `GET /v1/feature-flags/:key` - Get flag (Admin)
- `GET /v1/feature-flags/:key/status` - Check if flag is enabled
- `POST /v1/feature-flags` - Create flag (Admin)
- `PATCH /v1/feature-flags/:key/enable` - Enable flag (Admin)
- `PATCH /v1/feature-flags/:key/disable` - Disable flag (Admin)
- `PATCH /v1/feature-flags/:key/toggle` - Toggle flag (Admin)
- `DELETE /v1/feature-flags/:key` - Delete flag (Admin)

### WebSocket
- `ws://localhost:3000/ws` - WebSocket endpoint
- Events: `authenticate`, `join-room`, `leave-room`, `send-message`, `typing`

### Admin
- `/admin/queues` - Bull Board (queue monitoring UI)

### Documentation
- `/api-docs` - Swagger UI

## Environment Variables

See `.env.example` for all available environment variables.

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - JWT access token secret (min 32 chars)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (min 32 chars)
- `ENCRYPTION_KEY` - Encryption key for sensitive data (exactly 32 bytes)
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port

## Quick Start

```bash
# Install dependencies
pnpm install

# Start PostgreSQL and Redis
docker-compose up -d

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed database
pnpm prisma:seed

# Start development server
pnpm start:dev
```

## Test Credentials

After seeding:

**Admin:**
- Email: `admin@example.com`
- Password: `Admin123!`

**User:**
- Email: `user@example.com`
- Password: `User123!`

## Architecture Highlights

- **Global Guards**: ThrottlerGuard → JwtAuthGuard → RolesGuard
- **Global Interceptors**: TransformInterceptor, AuditInterceptor, MetricsInterceptor
- **Global Filters**: HttpExceptionFilter
- **Middleware**: RequestIdMiddleware, IdempotencyMiddleware

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7
- **Cache**: Redis 7
- **Queue**: BullMQ
- **Logger**: Pino
- **Auth**: JWT (Passport)
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Containerization**: Docker
- **Orchestration**: Kubernetes

## Development Workflow

1. **Code** → Write your features
2. **Validate** → TypeScript + ESLint
3. **Test** → Unit + E2E tests
4. **Build** → Compile TypeScript
5. **Docker** → Build container image
6. **Deploy** → Kubernetes rolling update

## Production Considerations

✅ Zero-downtime deployments
✅ Health checks and readiness probes
✅ Distributed cron jobs (no duplicate execution)
✅ Audit logging for compliance
✅ Metrics for monitoring
✅ Feature flags for safe rollouts
✅ Idempotency for duplicate request prevention
✅ Rate limiting for DDoS protection
✅ Encryption for sensitive data
✅ Role-based access control

## License

UNLICENSED
