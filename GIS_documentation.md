# AnchorMap — Ankara City GIS — Project Documentation

**Student:** Abdelkarem Ahmed
**Course:** GitHub & Vibe Coding Training — Work Experience
**Instructor:** Kürşat Enes Selçuk Yücel
**Institution:** Ostim Technical University
**Date:** August 14, 2026

---

## Table of Contents

1. Project Objective & Scope
2. System Architecture
3. Technology Stack
4. Why These Technologies?
5. Project Structure
6. Database Schema
7. GIS Architecture
8. API Endpoints
9. Key Features Implemented
10. UI/UX Design Decisions
11. Image Storage — Cloudinary CDN
12. Security Measures
13. Deployment Strategy
14. Challenges & Solutions
15. Admin Access Credentials

---

## 1. Project Objective & Scope

### Objective

The objective of this project is to design and develop a fully functional, production-ready **Geographic Information System (GIS)** web application for the city of Ankara, Turkey. AnchorMap serves as an interactive city guide that combines education, healthcare, emergency services, historical landmarks, cultural sites, and tourism — all visualized on a real, interactive map.

The application goes beyond a typical university assignment by implementing real PostGIS spatial queries, real OpenStreetMap geographic data, and a complete admin content management system — the type of GIS platform that municipalities and city agencies use professionally.

### Core Features Implemented

| Feature | Description | Status |
|---|---|---|
| Interactive Map | Leaflet.js map with OpenStreetMap tiles, viewport-based loading | Complete |
| Location Markers | Color-coded SVG pin markers per category, animated drop pin on search | Complete |
| Category Filter | 2-level filter panel (parent + child categories) with color indicators | Complete |
| Smart Search | Real-time full-text search in English and Turkish with fly-to animation | Complete |
| Nearby Locations | Find all points of interest within a given radius (PostGIS ST_DWithin) | Complete |
| Location Detail | Full detail page: description, hours, contact, photos, reviews | Complete |
| User Reviews | Authenticated users can rate (1–5 stars) and review any location | Complete |
| Favorites | Save locations to a personal favorites list | Complete |
| User Suggestions | Authenticated users can suggest new locations for admin review | Complete |
| Admin Dashboard | Full CRUD management of locations, categories, reviews, users | Complete |
| Admin Audit Log | Immutable record of all admin write actions | Complete |
| Image Upload (Cloudinary) | Location photos stored on CDN, not local disk | Complete |

**Out of Scope (Phase 1):**
- Real-time location tracking (GPS)
- Mobile native application
- Offline map tiles
- Payment or booking integrations

---

## 2. System Architecture

The project follows a **3-tier, monorepo architecture** with a clear separation between frontend, backend, and data layers.

```
ankara-gis/
├── apps/
│   ├── api/          ← Express.js backend (port 5000)
│   └── web/          ← Next.js frontend (port 3000)
├── packages/
│   ├── database/     ← Prisma schema + singleton client
│   └── types/        ← Shared TypeScript interfaces
├── docs/
├── docker-compose.yml
└── package.json
```

### 3-Tier Architecture

```
[Browser] → [Next.js :3000] → [Express API :5000] → [PostgreSQL + PostGIS]
                                                    → [Cloudinary CDN]
                          Map tiles ← OpenStreetMap Tile Server
```

### Request Flow (Map Pan)

```
1. User pans map → Leaflet fires moveend event
2. Frontend reads viewport bounds (minLat, maxLat, minLng, maxLng)
3. GET /api/v1/locations?minLat=...&maxLat=...&minLng=...&maxLng=...
4. LocationController → LocationService → LocationRepository
5. Repository executes PostGIS query:
      SELECT id, name, ST_Y(geom) AS lat, ST_X(geom) AS lng ...
      FROM locations
      WHERE status = 'approved'
        AND geom && ST_MakeEnvelope($minLng, $minLat, $maxLng, $maxLat, 4326)
6. Frontend updates Leaflet markers on the map
```

---

## 3. Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 14 | React framework with SSR for SEO pages, CSR for the interactive map |
| TypeScript | Type-safe JavaScript |
| Tailwind CSS | Utility-first CSS |
| Leaflet.js | Open-source interactive map library |
| OpenStreetMap | Free map tile provider (no API key required) |
| Zustand | Global state (auth state, map filter state) |
| Axios | HTTP client with JWT interceptor |

### Backend

| Technology | Purpose |
|---|---|
| Node.js 20 | JavaScript runtime |
| Express.js 4 | REST API framework |
| TypeScript | Type-safe backend |
| Prisma ORM 5 | Database client + migrations |
| PostGIS raw SQL | Spatial queries (ST_DWithin, ST_MakeEnvelope, ST_Distance) |
| JWT | Stateless auth (24h access + 7d refresh) |
| Bcrypt | Password hashing (cost factor 12) |
| Zod | Request validation |
| Helmet.js | Security HTTP headers |
| express-rate-limit | Rate limiting |

### Database & Infrastructure

| Technology | Purpose |
|---|---|
| PostgreSQL 15 | Primary relational database |
| PostGIS 3 | Geographic extension (GEOMETRY type, GIST index, spatial functions) |
| Supabase | Managed PostgreSQL + PostGIS hosting |
| Docker + Docker Compose | Local development containerization |
| Cloudinary CDN | Location photo storage |
| Vercel | Frontend deployment |
| Render | Backend API deployment |

---

## 4. Why These Technologies?

### Next.js (Frontend)

Location detail pages must appear in Google search results. When a user searches "Ankara museums" or "Kızılay hospitals", our pages must be indexable. Next.js provides **Server-Side Rendering (SSR)** for location and category pages. The interactive map uses **Client-Side Rendering (CSR)** since Leaflet requires the browser's window object and cannot run on the server.

### Express.js Backend (Not Next.js API Routes)

The backend is a separate Express.js application — not embedded into Next.js API routes. This provides full control over the middleware stack, PostGIS query layer, and API design. The API can be deployed independently from the frontend and is easier to test as the GIS query layer grows.

### PostgreSQL + PostGIS

Geographic data is inherently relational. PostGIS adds a GEOMETRY column type and spatial functions:
- `ST_DWithin` — finds locations within a radius in meters
- `ST_MakeEnvelope` — creates a bounding box for viewport queries
- `ST_Distance` — calculates real-world distance between two points
- GIST spatial index — makes spatial queries fast with thousands of records

PostGIS is the industry standard for GIS applications, powering OpenStreetMap itself.

### Leaflet.js + OpenStreetMap

Free (no API key, no billing), open-source, production quality (used by GitHub, Wikipedia, and city portals worldwide), and fully customizable for our category marker system.

### Cloudinary (Image Storage)

Docker container rebuilds delete locally stored files. Cloudinary provides permanent, globally distributed CDN URLs that survive server restarts and redeployments.

### Monorepo (npm Workspaces)

The `packages/types` workspace defines TypeScript interfaces once (Location, Category, User, Review) and shares them between frontend and backend. Both apps always have identical type definitions — preventing silent type mismatches.

---

## 5. Project Structure

### Frontend (apps/web/src/)

```
app/
├── (public)/
│   ├── page.tsx                  ← Home page (map + search)
│   ├── locations/[slug]/         ← Location detail (SSR)
│   ├── categories/[slug]/        ← Category page (SSR)
│   ├── search/page.tsx           ← Search results
│   ├── favorites/page.tsx        ← User favorites
│   ├── login/page.tsx
│   └── register/page.tsx
├── (admin)/admin/
│   ├── dashboard/                ← Admin overview
│   ├── locations/                ← Location CRUD + approval
│   ├── categories/               ← Category management
│   ├── reviews/                  ← Review moderation
│   ├── suggestions/              ← User suggestion review
│   ├── reports/                  ← Report management
│   ├── users/                    ← User management
│   └── audit-log/                ← Audit trail

components/
├── map/
│   ├── MapCanvas.tsx             ← Leaflet map (client-only)
│   ├── CategoryFilterPanel.tsx   ← 2-level category sidebar
│   └── SearchBar.tsx             ← Live search with fly-to
└── location/
    └── LocationDetailPanel.tsx   ← Side panel for selected location

store/
├── mapStore.ts                   ← Zustand: map state + filters
└── authStore.ts                  ← Zustand: user session
```

### Backend (apps/api/src/)

```
routes/
├── auth.routes.ts
├── locations.routes.ts           ← Public location endpoints
├── categories.routes.ts
├── search.routes.ts
├── reviews.routes.ts             ← Authenticated
├── favorites.routes.ts           ← Authenticated
├── suggestions.routes.ts         ← Authenticated
└── admin/
    ├── locations.routes.ts       ← Admin CRUD
    ├── reviews.routes.ts
    ├── users.routes.ts
    └── audit-log.routes.ts

middleware/
├── auth.middleware.ts            ← JWT → req.user
├── admin.middleware.ts           ← Role check (ADMIN only)
├── validate.middleware.ts        ← Zod validation
└── error.middleware.ts           ← Global error handler

repositories/
├── location.repository.ts        ← PostGIS spatial queries
├── category.repository.ts
└── review.repository.ts
```

---

## 6. Database Schema

### Entity Relationships

```
users
  ├── reviews / favorites / reports / suggestions / photos / audit_log

categories (self-referential, 2 levels)
  └── locations

locations
  ├── photos / reviews / favorites / reports / suggestions
```

### Key Models

**users**
```
id              UUID  (primary key)
email           TEXT  (unique)
name            TEXT
password_hash   TEXT  (bcrypt, NULL for Google OAuth)
role            TEXT  (USER | ADMIN)
provider        TEXT  (email | google)
email_verified  BOOLEAN
```

**categories**
```
id          UUID
name        TEXT    (English: 'Healthcare')
name_tr     TEXT    (Turkish: 'Sağlık')
slug        TEXT    (unique: 'healthcare')
color       TEXT    (hex: '#ef4444')
parent_id   UUID    (self-referential, NULL = top-level)
```

**Category Hierarchy:**
```
Education → University, School, Kindergarten, Library
Healthcare → Hospital, Clinic, Pharmacy, Dentist, Veterinary
Emergency & Security → Police Station, Fire Station, Emergency Hospital
Public Services → Government Office, Municipality, Post Office, Tax Office
Historical & Cultural → Museum, Historical Building, Monument, Mosque, Archaeological Site
Tourism & Recreation → Tourist Attraction, Landmark, Park, Hotel, Viewpoint
```

**locations (Core GIS Table)**
```
id              UUID
osm_id          BIGINT            (OpenStreetMap ID, unique)
slug            TEXT              (unique, URL-safe)
name            TEXT              (English)
name_tr         TEXT              (Turkish)
category_id     UUID              (FK → categories)
geom            GEOMETRY(POINT,4326)  ← THE CORE geographic column
district        TEXT              (Ankara district/ilçe)
description     TEXT              (English)
description_tr  TEXT              (Turkish)
phone / website / email / instagram
hours_json      JSONB             (structured opening hours)
tags            TEXT[]
status          TEXT              (pending | approved | rejected | deleted)
source          TEXT              (osm | manual | user_suggestion)
avg_rating      NUMERIC(3,2)
review_count    INT
```

**Spatial Indexes (required for GIS performance):**
```sql
CREATE INDEX locations_geom_gist ON locations USING GIST(geom);
CREATE INDEX locations_fts_en    ON locations USING GIN(to_tsvector('english', ...));
CREATE INDEX locations_fts_tr    ON locations USING GIN(to_tsvector('turkish', ...));
CREATE INDEX locations_name_trgm ON locations USING GIN(name gin_trgm_ops);
```

---

## 7. GIS Architecture

### Coordinate System

All coordinates are stored in **WGS84 (EPSG:4326)** — the same system used by GPS, Google Maps, and OpenStreetMap.

PostGIS stores points as `(x, y) = (longitude, latitude)`. This is the opposite of the conventional (lat, lng) notation. All code is explicit:
```sql
ST_Point(longitude, latitude)    -- CORRECT: X=lng, Y=lat
ST_X(geom) AS lng                -- Read longitude
ST_Y(geom) AS lat                -- Read latitude
```

Ankara bounding box: lat [39.50, 40.20], lng [32.30, 33.10]

### Core Spatial Queries

**Viewport Bounding Box (map pan/zoom):**
```sql
SELECT id, name, ST_Y(geom) AS lat, ST_X(geom) AS lng, category_id, slug
FROM locations
WHERE status = 'approved'
  AND geom && ST_MakeEnvelope($minLng, $minLat, $maxLng, $maxLat, 4326)
LIMIT 200;
```

**Proximity / Nearby Search:**
```sql
SELECT id, name, ST_Y(geom) AS lat, ST_X(geom) AS lng,
  ROUND(ST_Distance(geom::geography, ST_Point($lng, $lat)::geography)::numeric, 0) AS distance_m
FROM locations
WHERE status = 'approved'
  AND ST_DWithin(geom::geography, ST_Point($lng, $lat)::geography, $radiusMeters)
ORDER BY distance_m ASC LIMIT 20;
```

**Full-Text Search (English + Turkish):**
```sql
SELECT id, name, ST_Y(geom) AS lat, ST_X(geom) AS lng
FROM locations
WHERE status = 'approved'
  AND (
    name ILIKE '%' || $query || '%'
    OR name_tr ILIKE '%' || $query || '%'
    OR to_tsvector('english', name) @@ plainto_tsquery('english', $query)
    OR to_tsvector('turkish', name_tr) @@ plainto_tsquery('turkish', $query)
  )
LIMIT 50;
```

### Category Color Scheme

| Category | Color | Hex |
|---|---|---|
| Education | Blue | `#3b82f6` |
| Healthcare | Red | `#ef4444` |
| Emergency & Security | Orange | `#f97316` |
| Public Services | Purple | `#8b5cf6` |
| Historical & Cultural | Amber | `#d97706` |
| Tourism & Recreation | Green | `#10b981` |

---

## 8. API Endpoints

### Base URL

| Environment | URL |
|---|---|
| Development | `http://localhost:5000/api/v1` |
| Production | `https://anchormap-api.onrender.com/api/v1` |

### Standard Response Envelope

```json
{
  "success": true,
  "message": "Locations fetched.",
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 342, "totalPages": 18 }
}
```

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register |
| POST | `/auth/login` | None | Login, receive tokens |
| POST | `/auth/google` | None | Google OAuth |
| GET | `/auth/me` | JWT | Current user profile |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/logout` | JWT | Logout |

### Locations (Public)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/locations` | None | List with bbox, category, district, search filters |
| GET | `/locations/:slug` | None | Single location detail |
| GET | `/locations/:id/nearby` | None | Nearby locations by radius |
| GET | `/categories` | None | All categories + subcategories |
| GET | `/search?q=` | None | Full-text search |

### Authenticated Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/locations/:id/reviews` | JWT | Create review + rating |
| POST | `/favorites/:locationId` | JWT | Add to favorites |
| POST | `/reports` | JWT | Report inaccuracy |
| POST | `/suggestions` | JWT | Suggest new location |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/locations` | Admin | All locations (all statuses) |
| POST | `/admin/locations` | Admin | Create location |
| PATCH | `/admin/locations/:id` | Admin | Update location |
| DELETE | `/admin/locations/:id` | Admin | Soft-delete |
| POST | `/admin/locations/:id/approve` | Admin | Approve pending location |
| POST | `/admin/locations/bulk-approve` | Admin | Bulk approve |
| PATCH | `/admin/reviews/:id/hide` | Admin | Hide review |
| POST | `/admin/suggestions/:id/approve` | Admin | Approve → create location |
| PATCH | `/admin/users/:id/role` | Admin | Promote user to Admin |
| GET | `/admin/audit-log` | Admin | Full audit trail |

---

## 9. Key Features Implemented

### Interactive Map with Viewport-Based Loading

The map never loads all locations at once. Leaflet fires a `moveend` event when the user finishes panning or zooming. The frontend reads the new viewport bounds and calls the API — loading only what is visible. This keeps the UI responsive with thousands of locations in the database.

### 2-Level Category Filter Panel

A floating sidebar displays all 6 parent categories. Clicking a parent expands sub-categories, each with a color indicator matching the map marker color. Selecting a filter instantly triggers a filtered reload.

### Animated Search with Fly-To

Real-time full-text search (debounced). When a user selects a result, the map animates (`flyTo`) to that location and drops an animated SVG pin with a bounce effect.

### Color-Coded SVG Markers

Every category has a distinct hex color. Markers are custom SVG teardrop pins rendered via `L.divIcon` with category color, white inner circle, and colored center dot.

### Admin Dashboard

Full CRUD for locations, bulk approval workflow, review moderation, user suggestion review, report resolution, user role management, and complete audit log.

### Bilingual Support (English + Turkish)

Locations have `name` (English) and `name_tr` (Turkish). Full-text search queries both languages simultaneously.

---

## 10. UI/UX Design Decisions

### Design System

| Token | Value | Usage |
|---|---|---|
| Primary color | `#2563eb` (blue-600) | Buttons, active states, links |
| Display font | Inter (Google Fonts) | All UI text |
| Card radius | 12px | Panels, cards, modals |
| Sidebar width | 280px | Category filter panel |

### Map-Centric Layout

The map fills the full viewport height. The category filter panel floats as an overlay on the left. The location detail panel slides in from the right when a marker is clicked — maximizing map visibility.

---

## 11. Image Storage — Cloudinary CDN

### Problem

Docker container rebuilds permanently delete locally stored files. Using `/app/uploads` for location photos means losing all images whenever the server is updated or redeployed.

### Solution

All location photos upload to Cloudinary via `multer-storage-cloudinary`:

```
Admin uploads photo → Multer (memory buffer) → Cloudinary SDK → CDN URL
                                                               → Stored in photos table
```

### Environment Variables

```
CLOUDINARY_CLOUD_NAME   ← Account identifier
CLOUDINARY_API_KEY      ← API key
CLOUDINARY_API_SECRET   ← Secret (never exposed to frontend)
```

---

## 12. Security Measures

| Threat | Mitigation |
|---|---|
| Password theft | bcrypt hashing (cost factor 12) |
| Unauthorized API access | JWT verification middleware |
| Admin-only endpoints | `requireAdmin` middleware on every admin route independently |
| SQL injection | Prisma ORM (parameterized) + tagged template literals for PostGIS |
| File upload abuse | Multer: 5MB limit, JPEG/PNG/WebP only, Admin-only |
| Brute force login | Rate limit: 10 attempts per 15 minutes |
| XSS / Clickjacking | Helmet.js: X-Frame-Options, CSP, X-Content-Type-Options |
| CORS | Origin whitelist (localhost:3000 + production URL only) |
| Credential leakage | All secrets in .env files, excluded from Git |
| Admin bypass | Backend RBAC is the security boundary |

### JWT Token Strategy

```
Access Token:  24h expiry — Authorization: Bearer <token> header
Refresh Token: 7d expiry — HttpOnly + Secure + SameSite=Strict cookie
               (inaccessible to JavaScript → prevents XSS token theft)
```

### Audit Trail

Every admin write action records: who (user_id), what (CREATE/UPDATE/DELETE/APPROVE/REJECT/HIDE/PROMOTE), which record (entity_type + entity_id), before/after snapshot (changes_json), and timestamp.

---

## 13. Deployment Strategy

### Local Development

```bash
docker compose up -d
```

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (Express) | http://localhost:5000 |
| Database (PostGIS) | localhost:5432 |

### Production

| Component | Platform | Reason |
|---|---|---|
| Frontend | Vercel | Built by Next.js creators, zero-config, free tier |
| Backend API | Render | Supports Node.js + Docker, free tier |
| Database | Supabase | Managed PostgreSQL + PostGIS, automatic backups |
| Images | Cloudinary | Integrated, globally distributed CDN |

### Environment Variables (never committed to Git)

```
DATABASE_URL            ← Supabase connection string
JWT_SECRET              ← Minimum 64 characters
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_API_URL     ← Backend URL for frontend
FRONTEND_URL            ← Frontend URL for CORS
```

---

## 14. Challenges & Solutions

### Challenge 1: PostGIS Coordinate Order (lng vs lat)

**Problem:** PostGIS stores points as (x, y) = (longitude, latitude) — the opposite of conventional (lat, lng). Early code had `ST_Point(lat, lng)` — placing all markers at mirrored coordinates.

**Solution:** Added explicit column aliases everywhere:
```sql
ST_Y(geom) AS lat   -- Y = latitude
ST_X(geom) AS lng   -- X = longitude
ST_Point($lng, $lat) -- Always: X=lng, Y=lat
```
A Zod schema also validates that coordinates fall within Ankara's bounding box [39.5–40.2°N, 32.3–33.1°E], catching transposed values before they reach the database.

### Challenge 2: Leaflet Cannot Run Server-Side

**Problem:** Leaflet requires `window` and `document` — browser APIs absent in Node.js. Importing Leaflet in a Next.js component that runs server-side crashes the build.

**Solution:** The map component loads exclusively client-side using Next.js dynamic import with `ssr: false`:
```typescript
const MapCanvas = dynamic(() => import('@/components/map/MapCanvas'), { ssr: false });
```

### Challenge 3: PostGIS Binary Format in API Response

**Problem:** Selecting `l.*` returns the raw binary PostGIS geometry blob — unreadable as coordinates. The frontend received strings like `"0101000020E6100000..."`.

**Solution:** All PostGIS queries explicitly extract `ST_X(geom) AS lng` and `ST_Y(geom) AS lat`. The `geom` column itself is never selected. `SELECT l.*` is banned from the codebase.

### Challenge 4: Race Conditions in Location Fetch

**Problem:** When typing quickly, multiple API requests are sent. Responses arrive out of order — an older, slower response overwrites a newer one, showing stale results.

**Solution:** Implemented `AbortController` for all location fetch calls. Each new request cancels the previous one before sending.

### Challenge 5: Shared TypeScript Types Across Monorepo

**Problem:** Without a shared type source, the `Location` interface in the API could silently diverge from the frontend. The API adds a field — the frontend does not know — silent runtime bugs.

**Solution:** `packages/types` defines all shared interfaces once. Both apps import from this package. TypeScript compilation fails if either app uses a field not in the shared definition.

---

## 15. Admin Access Credentials

The following credentials are seeded by the database seed script (`packages/database/prisma/seed.ts`).

| Field | Value |
|---|---|
| **Email** | `admin@anchormap.dev` |
| **Password** | `Admin1234!` |
| **Role** | `ADMIN` |
| **Access URL (Local)** | http://localhost:3000/admin |
| **Access URL (Production)** | https://anchormap-web.vercel.app/admin |

The admin account has full access to: location CRUD and approval, category management, review moderation, user role management, suggestion review, report resolution, and audit log viewing.

---

## Conclusion

This project demonstrates the complete lifecycle of a modern, production-grade GIS web application — from architectural planning and PostGIS database design through TypeScript implementation, cloud deployment, and geographic data management.

AnchorMap is production-ready with:
- A **real geographic database** using industry-standard PostGIS spatial queries
- A **bilingual, SEO-optimized** Next.js frontend with server-side rendering
- A **secure REST API** with role-based access control and full audit logging
- A **cloud-native image pipeline** via Cloudinary CDN
- A **fully containerized** local development environment via Docker

Every technology choice was driven by a concrete, justified requirement. The result is a system that a real city administration or tourism authority could deploy today.

---

*This documentation was prepared as part of the GitHub & Vibe Coding Training program at Ostim Technical University.*
*Monorepo: ankara-gis (AnchorMap) | Student: SR | Date: August 14, 2026*
