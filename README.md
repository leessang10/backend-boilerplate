# NestJS Production Boilerplate

A production-ready NestJS boilerplate with authentication, authorization, monitoring, and best practices built-in.

## Features

### Core Features
- ✅ **API Versioning** - URI-based versioning (/v1/...)
- ✅ **Authentication & Authorization** - JWT-based with refresh tokens, RBAC
- ✅ **Password Hashing** - Argon2 for secure password storage
- ✅ **Logging** - Pino logger with request tracking
- ✅ **Encryption** - AES-256-GCM for sensitive data
- ✅ **Database** - Prisma ORM with PostgreSQL
- ✅ **Caching** - Redis integration
- ✅ **Health Checks** - Terminus for readiness/liveness probes
- ✅ **API Documentation** - Swagger/OpenAPI
- ✅ **Security** - Helmet, CORS, Rate limiting
- ✅ **Validation** - Class-validator with auto-transformation

### Production Features
- ✅ **Monitoring** - Prometheus metrics & Grafana dashboards
- ✅ **Docker** - Multi-stage Dockerfile & docker-compose
- ✅ **Kubernetes** - Deployment manifests with rolling updates
- ✅ **CI/CD** - GitHub Actions workflows
- ✅ **Error Handling** - Global exception filter with error codes
- ✅ **Request Tracking** - Request ID middleware
- ✅ **Sensitive Data Masking** - Automatic masking in logs

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT (Access/Refresh tokens)
- **Password Hashing**: Argon2
- **Logger**: Pino
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Monitoring**: Prometheus & Grafana
- **Testing**: Jest
- **Containerization**: Docker
- **Orchestration**: Kubernetes

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm
- Docker and Docker Compose (for local development)
- PostgreSQL 16+
- Redis 7+

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend-boilerplate
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start Docker services** (PostgreSQL & Redis)
```bash
docker-compose up -d
```

5. **Generate Prisma Client**
```bash
pnpm prisma:generate
```

6. **Run database migrations**
```bash
pnpm prisma:migrate
```

7. **Seed the database** (creates admin user)
```bash
pnpm prisma:seed
```

8. **Start the application**
```bash
pnpm start:dev
```

The API will be available at:
- **API**: http://localhost:3000/v1
- **Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/v1/health
- **Metrics**: http://localhost:3000/metrics
- **Bull Board**: http://localhost:3000/admin/queues
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

### Default Credentials

After seeding, you can use these credentials:

**Admin User**
- Email: `admin@example.com`
- Password: `Admin123!`

**Regular User**
- Email: `user@example.com`
- Password: `User123!`

## Project Structure

```
backend-boilerplate/
├── .github/
│   └── workflows/          # CI/CD workflows
├── k8s/                    # Kubernetes manifests
├── prisma/
│   ├── migrations/         # Database migrations
│   ├── schema.prisma       # Prisma schema
│   └── seed.ts            # Database seeding
├── src/
│   ├── cache/             # Cache module
│   ├── common/            # Common utilities
│   │   ├── constants/     # Error codes, etc.
│   │   ├── crypto/        # Encryption service
│   │   ├── decorators/    # Custom decorators
│   │   ├── filters/       # Exception filters
│   │   ├── guards/        # Auth guards
│   │   ├── interceptors/  # Request/Response interceptors
│   │   ├── interfaces/    # Common interfaces
│   │   ├── logger/        # Logger module
│   │   ├── middlewares/   # Custom middlewares
│   │   └── utils/         # Utility functions
│   ├── config/            # Configuration files
│   ├── modules/
│   │   ├── auth/          # Authentication
│   │   ├── health/        # Health checks
│   │   └── user/          # User management
│   ├── prisma/            # Prisma service
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## API Endpoints

### Authentication
- `POST /v1/auth/login` - Login user
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - Logout user

### Users
- `POST /v1/users` - Create user (public)
- `GET /v1/users/me` - Get current user profile
- `GET /v1/users` - List users (admin only)
- `GET /v1/users/:id` - Get user by ID
- `PATCH /v1/users/:id` - Update user
- `DELETE /v1/users/:id` - Delete user (admin only)

### Health
- `GET /v1/health` - Full health check
- `GET /v1/health/ready` - Readiness probe
- `GET /v1/health/live` - Liveness probe

## Scripts

### Development
```bash
pnpm start:dev          # Start in watch mode
pnpm start:debug        # Start in debug mode
```

### Building
```bash
pnpm build              # Build for production
pnpm start:prod         # Run production build
```

### Database
```bash
pnpm prisma:generate    # Generate Prisma Client
pnpm prisma:migrate     # Run migrations (dev)
pnpm prisma:migrate:prod # Run migrations (production)
pnpm prisma:seed        # Seed database
pnpm prisma:studio      # Open Prisma Studio
```

### Testing
```bash
pnpm test              # Run unit tests
pnpm test:watch        # Run tests in watch mode
pnpm test:cov          # Run tests with coverage
pnpm test:e2e          # Run e2e tests
```

### Code Quality
```bash
pnpm lint              # Run ESLint
pnpm format            # Format code with Prettier
```

## Environment Variables

See `.env.example` for all available environment variables.

### Critical Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development`, `production` |
| `PORT` | API port | `3000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `REDIS_HOST` | Redis host | `localhost` |
| `JWT_ACCESS_SECRET` | JWT access token secret | Min 32 characters |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Min 32 characters |
| `ENCRYPTION_KEY` | Encryption key | Exactly 32 bytes |

## Security Features

### Authentication & Authorization
- JWT-based authentication with access/refresh tokens
- Role-based access control (RBAC)
- Password hashing with Argon2
- Token rotation on refresh

### Data Protection
- AES-256-GCM encryption for sensitive data
- Automatic sensitive data masking in logs
- Request validation and sanitization
- XSS and CSRF protection via Helmet

### API Security
- Rate limiting (configurable)
- CORS configuration
- Request ID tracking
- Global exception handling

## Deployment

### Docker

Build and run with Docker:
```bash
docker build -t backend-api .
docker run -p 3000:3000 backend-api
```

### Kubernetes

1. **Create secrets**
```bash
kubectl create secret generic backend-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=jwt-access-secret=... \
  --from-literal=jwt-refresh-secret=... \
  --from-literal=encryption-key=...
```

2. **Apply manifests**
```bash
kubectl apply -f k8s/
```

3. **Check deployment**
```bash
kubectl rollout status deployment/backend-api
kubectl get pods -l app=backend-api
```

### Rolling Updates

The deployment is configured for zero-downtime rolling updates:
- `maxSurge: 1` - One extra pod during update
- `maxUnavailable: 0` - No downtime
- Readiness probes prevent traffic to unhealthy pods
- PodDisruptionBudget ensures minimum availability

### Rollback

If deployment fails, rollback:
```bash
kubectl rollout undo deployment/backend-api
kubectl rollout status deployment/backend-api
```

## Monitoring & Observability

### Health Checks
- `/v1/health` - Complete health check (DB, memory, disk)
- `/v1/health/ready` - Readiness probe (DB connection)
- `/v1/health/live` - Liveness probe (basic status)

### Logging
- Structured JSON logs in production
- Pretty logs in development
- Request/response logging with duration
- Automatic sensitive data masking
- Request ID tracking across services

## Best Practices

### Error Handling
- Centralized error codes
- Consistent error responses
- Detailed error logging
- No sensitive data in responses

### Database
- Prisma migrations for schema versioning
- Connection pooling
- Transaction support
- Soft deletes where appropriate

### Performance
- Redis caching
- Database indexing
- Efficient pagination
- Response compression

### Code Quality
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive tests

## Troubleshooting

### Database connection issues
```bash
# Check database status
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
pnpm prisma:migrate
```

### Redis connection issues
```bash
# Check Redis status
docker-compose ps redis

# Test connection
redis-cli ping
```

### Build issues
```bash
# Clean install
rm -rf node_modules dist
pnpm install
pnpm build
```

## Monitoring & Observability

This project includes a complete monitoring stack with Prometheus and Grafana.

### Quick Start

1. **Start monitoring services**:
```bash
docker-compose up -d prometheus grafana
```

2. **Access dashboards**:
- **Prometheus UI**: http://localhost:9090
- **Grafana Dashboard**: http://localhost:3001 (admin/admin)
- **Application Metrics**: http://localhost:3000/metrics

### Available Metrics

- **HTTP Metrics**: Request rate, duration, status codes
- **Authentication**: Login attempts, user registrations
- **Queue Jobs**: Completed/failed job counts
- **WebSocket**: Active connections
- **System**: CPU, memory, event loop lag

### Pre-configured Dashboard

A production-ready Grafana dashboard is automatically provisioned with:
- HTTP Request Rate & Duration
- Error Rate Monitoring
- Queue Job Processing
- WebSocket Connections
- System Health Metrics

### Documentation

For detailed monitoring setup and usage, see [MONITORING.md](./MONITORING.md).

## License

UNLICENSED
