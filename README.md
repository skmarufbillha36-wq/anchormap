# AnchorMap GIS — Ankara City Guide

> **A full-stack, production-grade GIS web application built as part of a university GitHub & Vibe Coding course.**

AnchorMap is an interactive city guide for Ankara, Turkey. It allows the public to explore geographic points of interest on a live Leaflet map, read reviews, save favorites, and submit location suggestions. Administrators manage all data through a built-in admin dashboard.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive Map** | Leaflet map with marker clustering, category-colored icons, popups |
| 🔍 **Full-Text Search** | Debounced search with PostgreSQL trigram indexing |
| 📍 **PostGIS Spatial** | Bounding-box queries, nearby radius search (ST_DWithin), exact distances |
| ⭐ **Reviews & Ratings** | Authenticated users can rate and review any location |
| ❤️ **Favorites** | Save locations to a personal list |
| 🚩 **Reports** | Users can report incorrect or inappropriate data |
| 💡 **Suggestions** | Users can propose new locations for admin review |
| 🔐 **Auth** | JWT access + HttpOnly refresh cookie, Google OAuth ready |
| ⚙️ **Admin Dashboard** | Full CRUD: locations, categories, reviews, reports, suggestions, users |
| 🐳 **Docker-First** | One command to spin up the full stack locally |
| 🗄️ **OSM Import** | Python script to bulk-import Ankara POIs from OpenStreetMap |

---

## 🏗️ Architecture

```
GIS/                        ← Monorepo root
├── apps/
│   ├── api/                ← Express.js + TypeScript backend
│   └── web/                ← Next.js 16 + App Router frontend
├── packages/
│   ├── database/           ← Prisma schema + migrations + seed
│   └── types/              ← Shared TypeScript interfaces
├── scripts/
│   ├── download_ankara_osm.sh
│   └── import_osm.py
└── docs/                   ← 27 architecture/engineering docs
```

**Tech stack:** Node 24 · Express 5 · Next.js 16 · React 19 · PostgreSQL 17 + PostGIS 3.5 · Prisma 6 · TypeScript 5 · Leaflet · TanStack Query · Zustand · Cloudinary · Docker

---

## 🚀 Quick Start (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A free [Cloudinary](https://cloudinary.com/) account (for photo uploads)

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd GIS

# Fill in your Cloudinary credentials in .env.docker
# The rest of the defaults work out of the box for local dev
```

Edit [`.env.docker`](.env.docker):
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. Start the full stack

```bash
make up
# Or without Make:
docker compose up --build
```

This starts:
| Service | URL |
|---|---|
| 🗺️ Frontend (Next.js) | http://localhost:3000 |
| ⚙️ Backend API (Express) | http://localhost:5000/api/v1 |
| 🐘 PostgreSQL + PostGIS | localhost:5432 |

### 3. Seed the database

```bash
make seed
```

This creates:
- 6 top-level categories (Education, Healthcare, Emergency, etc.) with subcategories
- Admin account: `admin@anchormap.tr` / password from `ADMIN_SEED_PASSWORD` (default: `AnkaraGIS2026!`)

### 4. Import OpenStreetMap data (optional but recommended)

```bash
# Install Python dependencies (once)
pip install osmium psycopg2-binary python-slugify python-dotenv

# Download and extract Ankara OSM data (~600 MB)
bash scripts/download_ankara_osm.sh

# Import into database
python scripts/import_osm.py --pbf data/ankara.osm.pbf --env .env.docker
```

---

## 🛠️ Development (without Docker)

### Prerequisites
- Node.js 22+ (LTS)
- PostgreSQL 17 with PostGIS 3.5 extension

```bash
# Install all dependencies
npm install

# Run database migrations
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

# Start the API (terminal 1)
cd apps/api && npm run dev

# Start the frontend (terminal 2)
cd apps/web && npm run dev
```

### Useful commands

```bash
make db-shell     # Open PostgreSQL shell
make logs-api     # Follow API logs
make studio       # Open Prisma Studio (visual DB browser)
make reset        # Wipe database and start fresh
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api/v1`

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/auth/register` | Register user |
| `POST` | `/auth/login` | Login |
| `GET` | `/auth/me` | Get current user |
| `GET` | `/locations` | Bbox query (map viewport) |
| `GET` | `/locations/:slug` | Location detail |
| `GET` | `/search?q=` | Full-text search |
| `GET` | `/categories` | All categories (tree) |
| `POST` | `/locations/:id/reviews` | Submit review |
| `POST` | `/locations/:id/favorite` | Add to favorites |
| `POST` | `/reports` | Submit a report |
| `POST` | `/suggestions` | Suggest a location |
| `GET` | `/admin/stats` | Dashboard statistics |
| `GET` | `/admin/locations` | Paginated locations list |
| `POST` | `/admin/locations` | Create location |
| `PATCH` | `/admin/locations/:id` | Update location |
| `DELETE` | `/admin/locations/:id` | Soft-delete location |

---

## 🗄️ Database Schema

9 core tables managed by Prisma + raw SQL for PostGIS:

```
users → reviews, favorites, audit_log
categories (self-referencing parent/child)
locations (geom geometry(Point,4326)) → photos, reviews, favorites, reports
suggestions
audit_log
```

Key PostGIS usage:
- `geom geometry(Point, 4326)` — all location coordinates stored as PostGIS geometry
- `ST_MakeEnvelope` — bounding-box viewport queries
- `ST_DWithin(...::geography, ..., radius_m)` — accurate meter-based nearby radius
- `ST_Distance(...::geography)` — real-world distance in metres
- GIST spatial index on `locations.geom`

---

## 🚢 Deployment

The application is designed to deploy to:

| Component | Platform | Notes |
|---|---|---|
| **Database** | Supabase (PostgreSQL + PostGIS) | Free tier available |
| **Backend API** | Render (Docker) | Free tier; set env vars |
| **Frontend** | Vercel or Render | `next build` output |

See [`docs/70-operations/`](docs/70-operations/) for detailed deployment guides.

---

## 📚 Documentation

All architecture decisions and technical documentation are in [`docs/`](docs/):

- `docs/00-product/` — Vision, personas, requirements, roadmap
- `docs/10-architecture/` — System, backend, frontend, GIS architecture
- `docs/30-contracts/` — API contracts
- `docs/40-data/` — Database schema, OSM import strategy
- `docs/50-engineering/` — Coding standards
- `docs/60-security/` — Security architecture
- `docs/70-operations/` — Local dev, Docker guides
- `docs/80-adr/` — Architecture Decision Records

---

## 📄 License

This project is built for educational purposes as part of a university work experience course.

Data from [OpenStreetMap](https://www.openstreetmap.org/) © OpenStreetMap contributors, licensed under [ODbL](https://opendatacommons.org/licenses/odbl/).
