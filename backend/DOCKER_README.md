# ============================================
# Docker Setup Guide
# Carpooling System Backend
# ============================================

## Quick Start

### Development Mode (with Local PostgreSQL)

```bash
# 1. Copy environment file
cp .env.docker .env

# 2. Start development environment
docker compose -f docker-compose.dev.yml up -d

# 3. Generate Prisma client
docker compose -f docker-compose.dev.yml exec backend npx prisma generate

# 4. Push schema to database
docker compose -f docker-compose.dev.yml exec backend npx prisma db push

# 5. View logs
docker compose -f docker-compose.dev.yml logs -f
```

### Production Mode (with Neon Cloud DB)

```bash
# 1. Copy environment file and configure
cp .env.docker .env
# Edit .env and add your Neon DATABASE_URL

# 2. Build and start production
docker compose up -d --build

# 3. View logs
docker compose logs -f
```

---

## Services

### Development Stack (`docker-compose.dev.yml`)

| Service | Port | Purpose |
|---------|------|---------|
| backend | 3000 | Node.js API |
| backend | 9229 | Debug port |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache |

### Production Stack (`docker-compose.yml`)

| Service | Port | Purpose |
|---------|------|---------|
| backend | 3000 | Node.js API |
| redis | 6379 | Redis cache |

---

## Commands

### Using Make (Recommended)

```bash
make dev          # Start development environment
make dev-down     # Stop development containers
make dev-logs     # View development logs
make dev-prisma   # Run Prisma commands in container
make prod        # Start production environment
make prod-down   # Stop production containers
make db-reset    # Reset database (WARNING: deletes data)
make clean        # Remove all containers and volumes
```

### Using Docker Compose Directly

```bash
# Development
docker compose -f docker-compose.dev.yml up -d        # Start
docker compose -f docker-compose.dev.yml down        # Stop
docker compose -f docker-compose.dev.yml logs -f      # Logs
docker compose -f docker-compose.dev.yml exec backend sh  # Shell access

# Production
docker compose up -d           # Start
docker compose down           # Stop
docker compose logs -f        # Logs
```

### Using npm Scripts

```bash
npm run docker:dev        # Start dev environment
npm run docker:dev:down   # Stop dev environment
npm run docker:dev:logs   # View dev logs
npm run docker:prod       # Start production
npm run docker:prisma      # Run Prisma in container
```

---

## Database Operations

### Prisma Commands

```bash
# Generate Prisma client
docker compose -f docker-compose.dev.yml exec backend npx prisma generate

# Push schema to database
docker compose -f docker-compose.dev.yml exec backend npx prisma db push

# Create migration
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Open Prisma Studio
docker compose -f docker-compose.dev.yml exec backend npx prisma studio

# Reset database
docker compose -f docker-compose.dev.yml exec backend npx prisma db push --force-reset
```

### Direct Database Access

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d carpooling

# Or use the Makefile
make shell-postgres
```

---

## Troubleshooting

### Container Issues

```bash
# View container status
docker compose -f docker-compose.dev.yml ps

# Check logs for specific service
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs postgres
docker compose -f docker-compose.dev.yml logs redis

# Rebuild containers
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

### Database Connection Issues

```bash
# Check if database is ready
docker compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres

# View database logs
docker compose -f docker-compose.dev.yml logs postgres
```

### Redis Connection Issues

```bash
# Test Redis connection
docker compose -f docker-compose.dev.yml exec redis redis-cli ping

# View Redis logs
docker compose -f docker-compose.dev.yml logs redis
```

---

## Volumes

Development volumes persist data between container restarts:

| Volume | Path | Purpose |
|--------|------|---------|
| postgres-data-dev | /var/lib/postgresql/data | PostgreSQL data |
| redis-data-dev | /data | Redis data |

### Clean Volumes

```bash
# Remove volumes (WARNING: deletes all data)
docker compose -f docker-compose.dev.yml down -v
```

---

## Environment Variables

### Required for Production

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your_secure_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Optional Overrides

```env
PORT=3000
REDIS_PASSWORD=your_redis_password
CORS_ORIGIN=http://localhost:3000
```

---

## Health Checks

### Check Service Health

```bash
# API Health
curl http://localhost:3000/api/v1/health

# Database Stats
curl http://localhost:3000/api/stats
```

### Docker Health Status

```bash
docker compose -f docker-compose.dev.yml ps
```

---

## Shell Access

### Backend Container

```bash
docker compose -f docker-compose.dev.yml exec backend sh
# or
make shell-backend
```

### PostgreSQL

```bash
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d carpooling
# or
make shell-postgres
```

### Redis

```bash
docker compose -f docker-compose.dev.yml exec redis redis-cli
# or
make shell-redis
```

---

## Development Workflow

### With Volume Mounts (Recommended for Development)

The `docker-compose.dev.yml` uses volume mounts for:
- `./src` → `/app/src` (source code)
- `./prisma` → `/app/prisma` (Prisma schema)

This means:
- Changes to source files are reflected immediately
- No need to rebuild container for code changes
- Nodemon auto-restarts the server

### Without Rebuilds

```bash
# Start with hot reload
docker compose -f docker-compose.dev.yml up -d

# Edit code in src/ folder
# Changes are auto-reloaded

# View logs
docker compose -f docker-compose.dev.yml logs -f backend
```

---

## Production Deployment

### Build Image

```bash
docker build -t carpooling-backend:latest .
```

### Run Production

```bash
# Set environment variables
export DATABASE_URL=postgresql://...
export JWT_SECRET=your_secret

# Run container
docker run -d \
  --name carpooling-backend \
  -p 3000:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e JWT_SECRET=$JWT_SECRET \
  carpooling-backend:latest
```

### Docker Hub (Future)

```bash
# Tag for Docker Hub
docker tag carpooling-backend:latest yourusername/carpooling-backend:latest

# Push to Docker Hub
docker push yourusername/carpooling-backend:latest
```

---

## Security Notes

1. **Never commit .env files** - Use environment variables or Docker secrets
2. **Change JWT_SECRET** - Use a strong, random secret in production
3. **Enable Redis password** - Add `REDIS_PASSWORD` in production
4. **Use SSL** - Always use `sslmode=require` for Neon connections
5. **Rate limiting** - Already configured, don't disable in production

---

## Resources

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/docker)
- [Neon Docs](https://neon.tech/docs/)
