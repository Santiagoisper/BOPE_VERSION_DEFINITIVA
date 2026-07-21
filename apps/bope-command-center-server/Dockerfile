# Multi-stage build for backend (Node.js TypeScript)
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

# Copy workspace root files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./

# Copy backend app source
COPY apps/bope-command-center-server ./apps/bope-command-center-server

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Build backend (TypeScript → JavaScript)
RUN pnpm --dir apps/bope-command-center-server build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Install pnpm and curl for healthcheck
RUN npm install -g pnpm && apk add --no-cache curl

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./

# Copy backend app source structure
COPY apps/bope-command-center-server ./apps/bope-command-center-server

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy compiled dist from builder
COPY --from=builder /app/apps/bope-command-center-server/dist ./apps/bope-command-center-server/dist

# Expose port (default 3100)
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3100/api/healthz || exit 1

# Start server from dist directory
WORKDIR /app/apps/bope-command-center-server
CMD ["node", "dist/server.js"]
