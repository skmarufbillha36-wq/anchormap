# System Architecture

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Overview

AnchorMap follows a **3-tier, monorepo architecture** with a clear separation between
frontend, backend, and data layers. The architecture is modeled after the Blossom Flower Shop
project (the team's first project) and extended with GIS-specific capabilities.

The key architectural decision is that the backend is a **separate Express.js application**,
not embedded into Next.js API routes. This provides full control over the REST API, middleware
stack, business logic, and GIS query layer.

See [ADR-002](../80-adr/ADR-002-separate-express-backend.md) for the rationale behind this decision.

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER / CLIENT                              │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              Next.js 14 Frontend                          │  │
│   │              (TypeScript, Tailwind CSS)                   │  │
│   │                                                           │  │
│   │  ┌────────────────┐   ┌────────────────────────────────┐ │  │
│   │  │   Next.js SSR  │   │  Leaflet.js Map (Client Only)  │ │  │
│   │  │   Pages/Layout │   │  - Marker Clustering           │ │  │
│   │  │   Auth Guard   │   │  - GeoJSON Overlays            │ │  │
│   │  │   Admin Guard  │   │  - Viewport-based loading      │ │  │
│   │  └────────────────┘   └────────────────────────────────┘ │  │
│   │                                                           │  │
│   │  Zustand (auth state, map state)                         │  │
│   │  Axios API client (with JWT interceptor)                 │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
               HTTPS / REST API
               Bearer JWT Token
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│              Node.js + Express.js Backend                        │
│              (TypeScript, port 5000)                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Middleware Stack                                         │   │
│  │  Helmet → CORS → Morgan → express.json → Routes          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────────────┐   │
│  │   Routes   │  │  Controllers│  │       Services          │   │
│  │ /api/v1/*  │→ │  (HTTP I/O) │→ │  (Business Logic)      │   │
│  └────────────┘  └─────────────┘  └───────────┬────────────┘   │
│                                                │                 │
│  ┌──────────────────────────────────────────┐  │                 │
│  │            Repositories                   │◄─┘                │
│  │  (Prisma ORM + raw PostGIS SQL)           │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
│  Cross-cutting: ApiError, ApiResponse, JWT utils, Zod schemas   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌──────────────────────┐  ┌───────────────────┐
│  Supabase PostgreSQL │  │   Cloudinary CDN  │
│  + PostGIS           │  │   (Image Storage) │
│                      │  │                   │
│  - locations table   │  │  - Location photos│
│  - GEOMETRY(POINT)   │  │  - Optimized URLs │
│  - GIST index        │  │  - Permanent CDN  │
│  - GIN FTS index     │  │    delivery       │
│  - All app tables    │  └───────────────────┘
└──────────────────────┘
          │
          │ (External, managed)
          ▼
  OpenStreetMap Tile Server
  (map.tile.openstreetmap.org)
  Base map tiles only — no data
```

---

## Monorepo Structure

The project uses **npm workspaces** to manage a monorepo with the following structure:

```
ankara-gis/                         ← Monorepo root
├── apps/
│   ├── api/                        ← Express.js backend
│   └── web/                        ← Next.js frontend
├── packages/
│   ├── database/                   ← Prisma schema + client
│   └── types/                      ← Shared TypeScript types
├── docs/                           ← All project documentation
├── docker-compose.yml              ← Development orchestration
├── docker-compose.prod.yml         ← Production orchestration
├── Makefile                        ← Developer shortcut commands
├── package.json                    ← Workspace root
├── .env.example                    ← Environment variable template
├── .gitignore
├── .prettierrc
└── README.md
```

### Why a Monorepo?

The same reason as the Flower Shop project: the `packages/types` workspace defines TypeScript
interfaces once (Location, Category, User, Review, etc.) and shares them between both the
frontend and backend. This guarantees that both sides always agree on data shapes,
preventing silent type mismatches.

See [ADR-001](../80-adr/ADR-001-monorepo-architecture.md).

---

## Layer Responsibilities

### Frontend (apps/web)

| Concern | Responsibility |
|---|---|
| Routing | Next.js App Router (file-system based) |
| Rendering | SSR for SEO-critical pages (location detail, category pages); CSR for the interactive map |
| Map | Leaflet.js (loaded client-only via dynamic import) |
| State | Zustand (auth state, map filter state) |
| API calls | Axios with base URL and JWT interceptor |
| Auth guard | Client-side redirect if no token; middleware.ts for Next.js route protection |
| Admin guard | Role check before rendering admin pages |

**The frontend has NO database access. All data comes through the backend API.**

### Backend (apps/api)

| Concern | Responsibility |
|---|---|
| HTTP | Express.js request/response handling |
| Auth | JWT generation and verification |
| RBAC | `authenticate` + `requireAdmin` middleware chain |
| Validation | Zod schemas on all request bodies |
| Business logic | Services layer (auth.service, location.service, etc.) |
| GIS queries | Repository layer using Prisma + raw PostGIS SQL |
| Error handling | Global `errorMiddleware` catches all thrown ApiErrors |
| Image upload | Multer → Cloudinary SDK → returns CDN URL |

### Database Package (packages/database)

| Concern | Responsibility |
|---|---|
| Schema | Single Prisma schema file (source of truth) |
| Migrations | Prisma Migrate (version-controlled SQL migrations) |
| Client | Singleton PrismaClient exported to both API and seed script |
| Seed | One-time seed script for initial categories and admin user |

### Types Package (packages/types)

| Concern | Responsibility |
|---|---|
| Shared types | All TypeScript interfaces used by both frontend and backend |
| Request DTOs | Input shapes for API requests |
| Response types | Output shapes from the API |
| Enums | Role, LocationStatus, ReviewStatus, etc. |

---

## Request Flow (Example: Get Nearby Locations)

```
1. User drags map → frontend detects viewport change
2. Frontend calls: GET /api/v1/locations?bbox=lng1,lat1,lng2,lat2&categoryId=...
3. Request reaches Express router → authenticate middleware (if needed)
4. LocationController.getAll() called
5. LocationService.getAll() applies business logic (validate bbox, apply filters)
6. LocationRepository.findByBbox() executes PostGIS spatial query:
      SELECT id, name, ST_X(geom) AS lng, ST_Y(geom) AS lat, ...
      FROM locations
      WHERE status = 'approved'
        AND geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
7. Repository returns typed result array
8. Service returns to controller
9. Controller: res.json(ApiResponseBuilder.success('Locations fetched.', locations))
10. Frontend receives GeoJSON-like array → Leaflet renders markers
```

---

## Communication Protocols

| From | To | Protocol | Format |
|---|---|---|---|
| Browser | Next.js | HTTP/HTTPS | HTML, JSON |
| Next.js (client) | Express API | HTTPS REST | JSON |
| Express | Supabase PostgreSQL | TCP (pg wire protocol) | SQL / Prisma |
| Express | Cloudinary | HTTPS | Multipart/JSON |
| Leaflet | OSM Tile Server | HTTPS | PNG tiles (256×256px) |

All API responses use the standardized `ApiResponse<T>` envelope:

```json
{
  "success": true,
  "message": "Human-readable description",
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 342, "totalPages": 18 }
}
```

---

## Environment Separation

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| **Development** | `localhost:3000` | `localhost:5000` | Local PostgreSQL+PostGIS (Docker) or Supabase dev |
| **Production** | Vercel | Railway / Render (Docker) | Supabase production |

In development, a local PostgreSQL+PostGIS container is available via Docker Compose.
In production, Supabase provides managed PostgreSQL+PostGIS with automatic backups.

---

*Document owner: Project team*
*Last updated: 2026-08-13*
*See also: [ADR-001](../80-adr/ADR-001-monorepo-architecture.md), [ADR-002](../80-adr/ADR-002-separate-express-backend.md)*
