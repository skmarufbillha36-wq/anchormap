# Docker Architecture

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Service Overview

```
Development environment (docker-compose.yml):
  ┌──────────────────────────────────────────────────────┐
  │  ankara_gis_db   postgis/postgis:15-3.4-alpine :5432 │
  │  ankara_gis_api  Node.js + Express          :5000    │
  │  ankara_gis_web  Next.js                   :3000     │
  │  ankara_gis_seed [optional, exits after run]         │
  └──────────────────────────────────────────────────────┘

Production environment:
  ┌──────────────────────────────────────────────────────┐
  │  [Supabase]      Managed PostgreSQL + PostGIS         │
  │  ankara_gis_api  Node.js + Express (Railway/Render)   │
  │  [Vercel]        Next.js (serverless)                 │
  └──────────────────────────────────────────────────────┘
```

---

## Development docker-compose.yml

```yaml
# IMPORTANT: Use postgis/postgis image, NOT postgres:15-alpine
# The plain postgres image does not have PostGIS pre-installed.
services:
  db:
    image: postgis/postgis:15-3.4-alpine
    container_name: ankara_gis_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ankara_gis
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d ankara_gis"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 15s
    networks:
      - ankara_net

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    image: ankara-gis-api:latest
    container_name: ankara_gis_api
    restart: unless-stopped
    ports:
      - "5000:5000"
    env_file:
      - .env.docker
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:5000/api/v1/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - ankara_net

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:5000/api/v1
    image: ankara-gis-web:latest
    container_name: ankara_gis_web
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      api:
        condition: service_healthy
    networks:
      - ankara_net

  seed:
    profiles: ["seed"]
    build:
      context: .
      dockerfile: packages/database/Dockerfile.seed
    container_name: ankara_gis_seed
    env_file:
      - .env.docker
    depends_on:
      db:
        condition: service_healthy
    restart: "no"
    networks:
      - ankara_net

networks:
  ankara_net:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

---

## Backend Dockerfile (apps/api/Dockerfile)

Multi-stage build: deps → builder (esbuild) → runner (minimal Alpine)

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json ./
COPY packages/types/package.json       ./packages/types/
COPY packages/database/package.json    ./packages/database/
COPY apps/api/package.json             ./apps/api/

RUN npm install --legacy-peer-deps

# Stage 2: Generate Prisma + Bundle with esbuild
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/types     ./packages/types
COPY packages/database  ./packages/database
COPY apps/api           ./apps/api

# Generate Prisma Client (must run before bundling)
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Bundle into single file
RUN cd apps/api && npx esbuild src/server.ts \
      --bundle \
      --platform=node \
      --target=node20 \
      --outfile=dist/server.js \
      --external:@prisma/client \
      --external:bcryptjs \
      --external:cloudinary \
      --external:multer \
      --external:passport \
      --external:passport-google-oauth20

# Stage 3: Minimal production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache wget openssl

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 expressjs

COPY --from=builder --chown=expressjs:nodejs /app/node_modules              ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/dist/server.js   ./server.js
COPY --from=builder --chown=expressjs:nodejs /app/packages/database/prisma  ./packages/database/prisma

COPY --chown=expressjs:nodejs apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER expressjs
EXPOSE 5000

ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node

ENTRYPOINT ["./entrypoint.sh"]
```

---

## Backend Entrypoint (apps/api/entrypoint.sh)

```sh
#!/bin/sh
set -e

echo ""
echo "🗺️  ================================="
echo "   AnchorMap GIS API"
echo "================================= 🗺️"
echo ""
echo "⏳ Running database migrations..."

npx prisma migrate deploy \
  --schema=./packages/database/prisma/schema.prisma

echo "✅ Migrations complete!"
echo "🚀 Starting server on port ${PORT:-5000}..."
echo ""

exec node server.js
```

**Key design choice:** Migrations run at container startup, not at build time.
This ensures migrations are always applied when the container starts, including
after a deployment that includes new migrations.

---

## Frontend Dockerfile (apps/web/Dockerfile)

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json ./
COPY packages/types/package.json       ./packages/types/
COPY packages/database/package.json    ./packages/database/
COPY apps/web/package.json             ./apps/web/

RUN npm install --legacy-peer-deps

# Stage 2: Build Next.js
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/types    ./packages/types
COPY packages/database ./packages/database
COPY apps/web          ./apps/web

ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN cd apps/web && npx next build

# Stage 3: Minimal production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone     ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static         ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public               ./apps/web/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
```

**Note:** The `NEXT_PUBLIC_API_URL` build argument is baked into the Next.js bundle at build time.
For production Docker deployments, pass the correct production API URL:
```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.anchormap.example.com/api/v1 \
  -f apps/web/Dockerfile -t ankara-gis-web .
```

---

## Database Seed Dockerfile (packages/database/Dockerfile.seed)

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package.json ./
COPY packages/types/package.json       ./packages/types/
COPY packages/database/package.json    ./packages/database/

RUN npm install --legacy-peer-deps

COPY packages/types    ./packages/types
COPY packages/database ./packages/database

RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

CMD ["npx", "ts-node", "packages/database/src/seed.ts"]
```

---

## .dockerignore

```
node_modules
.next
dist
*.osm.pbf
.env
.env.*
!.env.example
.git
.gitignore
*.log
README.md
docs/
```

---

## Health Checks

All containers that serve traffic have health checks:

| Container | Health Check | Interval |
|---|---|---|
| db | `pg_isready -U postgres -d ankara_gis` | 5s |
| api | `wget -qO- http://localhost:5000/api/v1/health` | 10s |
| web | `wget -qO- http://localhost:3000` | 10s |

Health check dependency ensures startup order: `db` must be healthy before `api` starts;
`api` must be healthy before `web` starts.

---

*Document owner: Project team*
*Last updated: 2026-08-13*
*See also: [ADR-006](../80-adr/ADR-006-docker-strategy.md)*
