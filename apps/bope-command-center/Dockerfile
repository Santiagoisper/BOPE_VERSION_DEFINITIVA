# Multi-stage build for frontend (React + Vite)
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

# Copy workspace root files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./

# Copy frontend app
COPY apps/bope-command-center ./apps/bope-command-center

# Install dependencies (pnpm will use workspace)
RUN pnpm install --frozen-lockfile

# Build frontend
RUN pnpm --dir apps/bope-command-center build

# Stage 2: Runtime with Nginx
FROM nginx:alpine
WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/apps/bope-command-center/dist/public /usr/share/nginx/html

# Create Nginx config with proxy to backend
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 3000;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }
}
EOF

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000 || exit 1

# Expose port
EXPOSE 3000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
