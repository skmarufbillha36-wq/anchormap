# ADR-006: Docker Strategy

**Status:** Accepted
**Date:** 2026-08-13

---

## Context

The team has committed to a Docker-first development and deployment approach.
The goal is: "Clone the repository, configure environment variables, run `make up`,
and have a fully running application."

We need to decide the Docker architecture: how many containers, what images, how dev and prod differ.

---

## Decision

### Services

```yaml
# Development: docker-compose.yml
services:
  db:   PostgreSQL 15 + PostGIS 3 (local dev only)
  api:  Express.js backend
  web:  Next.js frontend
  seed: One-time DB seeder (optional profile)

# Production: external managed services replace the local db container
# Supabase = managed PostgreSQL + PostGIS
# No db container in production
```

### Dockerfile Strategy

Each application has a **multi-stage Dockerfile**:

```
Stage 1: deps    → Install npm dependencies only
Stage 2: builder → Compile TypeScript / build Next.js bundle
Stage 3: runner  → Minimal image with only production artifacts
```

This results in small production images (~150-250MB) vs. a naive approach (~800MB+).

### Development vs. Production

| Concern | Development | Production |
|---|---|---|
| Database | Local PostgreSQL+PostGIS container | Supabase (managed, external) |
| Frontend build | `next dev` (hot reload) | `next build` + standalone output |
| Backend build | `ts-node-dev` (watch + reload) | `esbuild` bundle + `node server.js` |
| Compose file | `docker-compose.yml` | `docker-compose.prod.yml` |
| Secrets | `.env.docker` file | Platform environment variables |

### Database Migration Strategy

The API container entrypoint runs `prisma migrate deploy` before starting the server.
This ensures migrations are always applied when a new container starts — in both
dev and production environments.

```sh
# entrypoint.sh
#!/bin/sh
set -e
echo "⏳ Running database migrations..."
npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
echo "✅ Migrations complete!"
exec node server.js
```

---

## Rationale

### Why Not Use a Dev-Only Image Without Build Step?

The Flower Shop project taught us that the development Docker experience (with volume mounts
for hot reload) and the production image (with compiled artifacts) should differ.
For development, `ts-node-dev` is fast and provides hot reload. For production, esbuild
bundles everything into a single optimized file.

### Why postgres:15-alpine for Local Dev?

- Small image (~150MB vs ~300MB for full postgres)
- PostGIS can be added as an extension after database initialization
- Matches the PostgreSQL version used on Supabase

**Important**: The local dev container needs PostGIS. We use `postgis/postgis:15-3.4-alpine`
as the image (which has PostGIS pre-installed) rather than plain `postgres:15-alpine`.

### Why Multi-Stage Builds?

Single-stage builds include all development dependencies (TypeScript, ts-node, esbuild, etc.)
in the production image. Multi-stage builds separate the build environment from the runtime
environment, producing smaller, more secure images.

### Why Not Docker for Everything (Including Supabase)?

Supabase in production is a managed service. Running it locally in Docker for development
adds significant complexity (12+ Supabase internal containers) for minimal benefit.
A local PostgreSQL + PostGIS container is simpler and sufficient for development.

In production, Supabase provides managed backups, connection pooling, and high availability
that would be complex to replicate with self-hosted PostgreSQL.

---

## Consequences

**Positive:**
- "Clone and run" reproducibility
- Identical environments across developer machines
- Production-realistic local environment
- Small, secure production images

**Negative:**
- Two docker-compose files to maintain (dev + prod)
- PostGIS image must be specifically `postgis/postgis` not plain `postgres`
- Build times on first run (~3-5 minutes for all images)
