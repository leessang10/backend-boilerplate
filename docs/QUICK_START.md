# Quick Start Guide

This guide will get you up and running with the NestJS Production Boilerplate in 5 minutes.

## Prerequisites

- Node.js 20+ with pnpm installed
- Docker Desktop running (for PostgreSQL and Redis)

## Setup Steps

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Docker Services
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Set Up Environment
```bash
# Copy example env file
cp .env.example .env

# The defaults work for local development!
# Just make sure to change JWT secrets in production
```

### 4. Initialize Database
```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed with admin user
pnpm prisma:seed
```

### 5. Start the Application
```bash
pnpm start:dev
```

## Verify It Works

### Test the API

1. **Open Swagger Documentation**
   - Visit: http://localhost:3000/api-docs
   - You should see the full API documentation

2. **Check Health Endpoint**
   ```bash
   curl http://localhost:3000/v1/health
   ```

3. **Login as Admin**
   ```bash
   curl -X POST http://localhost:3000/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "Admin123!"
     }'
   ```

   You'll get back:
   ```json
   {
     "success": true,
     "data": {
       "user": { ... },
       "accessToken": "eyJhbGc...",
       "refreshToken": "eyJhbGc..."
     },
     "timestamp": "2024-..."
   }
   ```

4. **Get Your Profile** (using the access token)
   ```bash
   curl http://localhost:3000/v1/users/me \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Default Test Accounts

After seeding, two accounts are available:

**Admin Account**
- Email: `admin@example.com`
- Password: `Admin123!`
- Role: ADMIN
- Can access all endpoints

**Regular User**
- Email: `user@example.com`
- Password: `User123!`
- Role: USER
- Limited access

## Available URLs

Once running, access:

| Service | URL |
|---------|-----|
| API Base | http://localhost:3000/v1 |
| API Documentation | http://localhost:3000/api-docs |
| Health Check | http://localhost:3000/v1/health |
| Prisma Studio | Run `pnpm prisma:studio` |

## Key Features to Try

### 1. Authentication Flow
```bash
# Login
POST /v1/auth/login
{
  "email": "admin@example.com",
  "password": "Admin123!"
}

# Get your profile
GET /v1/users/me
Authorization: Bearer {accessToken}

# Refresh token
POST /v1/auth/refresh
{
  "refreshToken": "{refreshToken}"
}

# Logout
POST /v1/auth/logout
Authorization: Bearer {accessToken}
```

### 2. User Management (Admin Only)
```bash
# List all users (requires ADMIN role)
GET /v1/users?page=1&limit=10

# Get specific user
GET /v1/users/{userId}

# Update user
PATCH /v1/users/{userId}
{
  "firstName": "Updated",
  "lastName": "Name"
}

# Delete user (requires ADMIN role)
DELETE /v1/users/{userId}
```

### 3. Create New User (Public Endpoint)
```bash
POST /v1/users
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "New",
  "lastName": "User"
}
```

## Development Workflow

### Watch Mode
```bash
pnpm start:dev
```
The server automatically restarts on file changes.

### Debug Mode
```bash
pnpm start:debug
```
Attach your debugger to port 9229.

### Check Logs
The application uses Pino for logging:
- Pretty, colorized logs in development
- Structured JSON logs in production
- Request/response logging with timing
- Automatic sensitive data masking

### Database Management
```bash
# Open Prisma Studio (GUI for database)
pnpm prisma:studio

# Create a new migration
pnpm prisma:migrate

# Reset database (⚠️ deletes all data)
docker-compose down -v
docker-compose up -d
pnpm prisma:migrate
pnpm prisma:seed
```

## Common Issues

### Port Already in Use
If port 3000 is busy, change it in `.env`:
```env
PORT=3001
```

### Docker Services Not Starting
```bash
# Check Docker is running
docker ps

# Restart services
docker-compose down
docker-compose up -d

# View logs
docker-compose logs postgres
docker-compose logs redis
```

### Prisma Client Out of Sync
```bash
pnpm prisma:generate
```

### Build Errors
```bash
# Clean install
rm -rf node_modules dist
pnpm install
pnpm build
```

## Next Steps

### Explore the Code
- Check `src/modules/auth/` for authentication logic
- Review `src/modules/user/` for CRUD patterns
- See `src/common/` for reusable utilities

### Add Your Domain Logic
1. Create a new module: `nest g module modules/your-feature`
2. Add service: `nest g service modules/your-feature`
3. Add controller: `nest g controller modules/your-feature`
4. Update Prisma schema if needed
5. Run migrations: `pnpm prisma:migrate`

### Deploy to Production
See `README.md` for:
- Docker deployment
- Kubernetes manifests
- CI/CD workflows
- Production environment setup

## Architecture Overview

```
Authentication Flow:
User → Login → JWT (Access + Refresh) → Protected Routes

Request Flow:
Client → Rate Limiter → JWT Guard → Roles Guard → Controller
       → Service → Prisma → Database

Response Flow:
Controller → Transform Interceptor → Standard Format → Client
           ↓
        Logging Interceptor → Pino Logger
```

## Security Features Active

- ✅ Helmet (security headers)
- ✅ CORS (configured origins)
- ✅ Rate limiting (10 req/min default)
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Request validation
- ✅ Data encryption (AES-256-GCM)
- ✅ Password hashing (Argon2)
- ✅ Request ID tracking
- ✅ Sensitive data masking

## Questions?

- Read the full `README.md` for comprehensive documentation
- Check `IMPLEMENTATION_STATUS.md` for what's implemented
- Visit `http://localhost:3000/api-docs` for API reference
- Open an issue in the repository

Happy coding! 🚀
