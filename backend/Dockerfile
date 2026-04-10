# ============================================
# Carpooling System - Production Dockerfile
# ============================================

# Stage 1: Base dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Development dependencies (for prisma)
FROM node:20-alpine AS prisma-deps

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy prisma schema
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Stage 3: Production build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy prisma schema
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src/ ./src/

# Stage 4: Production runtime
FROM node:20-alpine AS runner

# Set NODE_ENV
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma client from prisma-deps stage
COPY --from=prisma-deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma-deps /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy application code from builder stage
COPY --from=builder /app/src ./src

# Copy package files
COPY package*.json ./

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start application
CMD ["node", "src/server.js"]
