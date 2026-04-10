# ============================================
# Carpooling System - Makefile for Docker
# ============================================

.PHONY: help build up down logs ps dev prod prisma db-reset clean

# Default target
help:
	@echo "Carpooling System - Docker Commands"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev          - Start development environment (local DB)"
	@echo "  make dev-up       - Start dev containers"
	@echo "  make dev-down     - Stop dev containers"
	@echo "  make dev-logs     - View dev container logs"
	@echo ""
	@echo "Production Commands:"
	@echo "  make prod         - Start production environment (Neon DB)"
	@echo "  make prod-up      - Start production containers"
	@echo "  make prod-down    - Stop production containers"
	@echo "  make prod-logs    - View production container logs"
	@echo ""
	@echo "Database Commands:"
	@echo "  make prisma-generate  - Generate Prisma client"
	@echo "  make prisma-push     - Push schema to database"
	@echo "  make prisma-studio   - Open Prisma Studio"
	@echo "  make db-reset        - Reset database (WARNING: deletes data)"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make build        - Build Docker images"
	@echo "  make ps           - List running containers"
	@echo "  make logs         - View all container logs"
	@echo "  make clean        - Remove containers and volumes"
	@echo "  make health       - Check container health"
	@echo ""

# ==========================================
# Development Commands
# ==========================================
dev: dev-up

dev-up:
	docker compose -f docker-compose.dev.yml up -d
	@echo "Dev environment started!"
	@echo "  API: http://localhost:3000"
	@echo "  Debug: localhost:9229"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis: localhost:6379"

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

dev-prisma:
	docker compose -f docker-compose.dev.yml exec backend npx prisma generate
	docker compose -f docker-compose.dev.yml exec backend npx prisma db push

# ==========================================
# Production Commands
# ==========================================
prod: prod-up

prod-up:
	docker compose up -d --build
	@echo "Production environment started!"
	@echo "  API: http://localhost:3000"

prod-down:
	docker compose down

prod-logs:
	docker compose logs -f

# ==========================================
# Prisma Commands
# ==========================================
prisma-generate:
	docker compose -f docker-compose.dev.yml exec backend npx prisma generate

prisma-push:
	docker compose -f docker-compose.dev.yml exec backend npx prisma db push

prisma-studio:
	docker compose -f docker-compose.dev.yml exec backend npx prisma studio

prisma-migrate:
	docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# ==========================================
# Database Commands
# ==========================================
db-reset:
	@echo "WARNING: This will delete all data in the database!"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker compose -f docker-compose.dev.yml exec backend npx prisma db push --force-reset; \
		echo "Database reset complete!"; \
	else \
		echo "Cancelled."; \
	fi

# ==========================================
# Utility Commands
# ==========================================
build:
	docker compose build

ps:
	docker compose -f docker-compose.dev.yml ps

logs:
	docker compose -f docker-compose.dev.yml logs -f --tail=100

clean:
	docker compose -f docker-compose.dev.yml down -v
	docker compose down -v
	@echo "Containers and volumes removed!"

health:
	@echo "Container Health Status:"
	@docker compose -f docker-compose.dev.yml ps

# ==========================================
# Shell Access
# ==========================================
shell-backend:
	docker compose -f docker-compose.dev.yml exec backend sh

shell-postgres:
	docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d carpooling

shell-redis:
	docker compose -f docker-compose.dev.yml exec redis redis-cli
