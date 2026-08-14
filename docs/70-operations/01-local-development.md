# Local Development Guide

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | Bundled with Node.js |
| Docker Desktop | Latest | https://docker.com |
| Git | Latest | https://git-scm.com |
| osmium-tool | Latest | https://osmcode.org/osmium-tool (for data import only) |

---

## Option 1: Docker Setup (Recommended)

The easiest way to get started. No local PostgreSQL or PostGIS installation required.

### Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd ankara-gis
```

### Step 2 — Configure Environment Variables

```bash
cp .env.example .env.docker
```

Edit `.env.docker` with your actual credentials:

```env
# Database (local Docker PostgreSQL+PostGIS)
DATABASE_URL=postgresql://postgres:postgres123@db:5432/ankara_gis

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-64-characters-long-change-this
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary (required for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth (optional for local dev — can be left blank)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Next.js — baked into frontend at build time
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Step 3 — Start All Services

```bash
make up
# OR:
docker compose up --build
```

This will:
- Pull `postgis/postgis:15-3.4-alpine` (PostgreSQL + PostGIS)
- Build the API image (`esbuild` TypeScript bundle)
- Build the Web image (Next.js standalone)
- Run Prisma migrations automatically
- Start all 3 services

First build takes 3–5 minutes.

### Step 4 — Seed Categories and Admin User

```bash
make seed
# OR:
docker compose --profile seed run --rm seed
```

This creates:
- 6 parent categories (Education, Healthcare, Emergency, Public Services, Historical, Tourism)
- All subcategories
- 1 Admin user: `admin@anchormap.local` / `admin123456`

### Step 5 — Open in Browser

| URL | Description |
|---|---|
| http://localhost:3000 | Public map application |
| http://localhost:3000/admin | Admin dashboard |
| http://localhost:5000/api/v1/health | API health check |

---

## Option 2: Local Development Without Docker

Use this if you want hot-reload for both frontend and backend simultaneously.

### Prerequisites for This Option

- PostgreSQL 15+ installed locally with PostGIS 3 extension
- OR: Use Docker only for the database (`make db`) and run API + Web locally

### Step 1 — Install Dependencies

```bash
npm install --legacy-peer-deps
```

### Step 2 — Configure Environment

```bash
# Copy and configure API environment
cp apps/api/.env.example apps/api/.env

# Copy and configure Web environment
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/ankara_gis
JWT_SECRET=your-super-secret-key-at-least-64-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:3000
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Step 3 — Set Up Database

```bash
# Start only the database container
docker compose up db -d

# OR: Create database manually if using local PostgreSQL
psql -U postgres -c "CREATE DATABASE ankara_gis;"
psql -U postgres -d ankara_gis -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -U postgres -d ankara_gis -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql -U postgres -d ankara_gis -c "CREATE EXTENSION IF NOT EXISTS unaccent;"
```

### Step 4 — Generate Prisma Client and Run Migrations

```bash
# Generate Prisma client (required before first run and after schema changes)
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Run migrations
npx prisma migrate dev --schema=packages/database/prisma/schema.prisma
```

### Step 5 — Seed Database

```bash
npx ts-node packages/database/src/seed.ts
```

### Step 6 — Start Both Services

```bash
# Start API + Web simultaneously (with hot reload)
npm run dev

# OR start separately:
npm run dev:api    # Express API on http://localhost:5000
npm run dev:web    # Next.js on http://localhost:3000
```

---

## Makefile Commands

```bash
make help       # Show all available commands
make up         # Build and start all Docker services
make upd        # Build and start in background (detached)
make down       # Stop all services
make build      # Rebuild all Docker images
make seed       # Run database seed
make db         # Start only the database container
make logs       # Follow all service logs
make logs-api   # Follow API logs only
make logs-web   # Follow Web logs only
make ps         # Show running containers
make reset      # Stop + delete volumes (fresh database)
make clean      # Remove all containers, images, volumes
make db-shell   # Open PostgreSQL shell
make migrate    # Run pending database migrations
make studio     # Open Prisma Studio (visual DB browser)
```

---

## Database Commands

```bash
# Generate Prisma client (after schema changes)
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Create a new migration
npx prisma migrate dev --name add_location_tags \
  --schema=packages/database/prisma/schema.prisma

# Apply pending migrations (production)
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

# Open visual database browser
npx prisma studio --schema=packages/database/prisma/schema.prisma

# Reset database (WARNING: deletes all data)
npx prisma migrate reset --schema=packages/database/prisma/schema.prisma
```

---

## Data Import

Run the OSM import after setting up the database. See full instructions in
[`docs/40-data/02-osm-import-strategy.md`](../40-data/02-osm-import-strategy.md).

```bash
# 1. Download Turkey extract (~650MB, one time)
curl -O https://download.geofabrik.de/europe/turkey-latest.osm.pbf

# 2. Extract Ankara region
osmium extract --bbox=32.30,39.50,33.10,40.20 turkey-latest.osm.pbf -o ankara.osm.pbf

# 3. Run import script
npx ts-node docs/scripts/import-osm.ts --input ankara.osm.pbf

# 4. Go to /admin/import to approve locations
```

---

## Troubleshooting

### ❌ `Port already in use`

```bash
# Windows: Find and kill the process using port 5000 or 3000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### ❌ `Prisma Client not found`

```bash
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

### ❌ `Cannot find module '@ankara-gis/types'`

```bash
npm install --legacy-peer-deps
```

### ❌ `PostGIS extension not found`

```bash
# Connect to the database and enable PostGIS:
docker compose exec db psql -U postgres -d ankara_gis
# Then run:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
```

### ❌ `Leaflet window is not defined`

The map component is being rendered server-side. Ensure the map is imported with:
```typescript
import dynamic from 'next/dynamic';
const Map = dynamic(() => import('./Map'), { ssr: false });
```

### ❌ TypeScript errors in VS Code

```bash
npx prisma generate --schema=packages/database/prisma/schema.prisma
# Then in VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## VS Code Recommended Extensions

- **Prisma** — Syntax highlighting for `.prisma` files
- **ESLint** — Real-time linting
- **Prettier** — Code formatting
- **Docker** — Manage containers from VS Code
- **REST Client** — Test API endpoints directly in VS Code
- **GitLens** — Git history and blame

---

*Document owner: Project team*
*Last updated: 2026-08-13*
