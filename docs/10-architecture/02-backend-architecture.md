# Backend Architecture

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Overview

The backend is a **Node.js + Express.js REST API** written in TypeScript.
It is the sole point of truth for business logic, geographic data operations,
authentication, and data access.

The backend follows the same layered architecture proven in the Flower Shop project,
extended with a dedicated GIS layer for spatial operations.

---

## Directory Structure

```
apps/api/
├── src/
│   ├── app.ts                  ← Express app factory (middleware, routes)
│   ├── server.ts               ← DB connection + server start + graceful shutdown
│   │
│   ├── config/
│   │   └── env.ts              ← Zod-validated environment variables
│   │
│   ├── routes/
│   │   ├── index.ts            ← Router aggregator (/api/v1/*)
│   │   ├── auth.routes.ts
│   │   ├── locations.routes.ts
│   │   ├── categories.routes.ts
│   │   ├── reviews.routes.ts
│   │   ├── favorites.routes.ts
│   │   ├── reports.routes.ts
│   │   ├── suggestions.routes.ts
│   │   ├── upload.routes.ts
│   │   └── admin/
│   │       ├── index.ts        ← Admin router aggregator
│   │       ├── locations.admin.routes.ts
│   │       ├── categories.admin.routes.ts
│   │       ├── reviews.admin.routes.ts
│   │       ├── reports.admin.routes.ts
│   │       ├── suggestions.admin.routes.ts
│   │       ├── users.admin.routes.ts
│   │       └── audit.admin.routes.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── locations.controller.ts
│   │   ├── categories.controller.ts
│   │   ├── reviews.controller.ts
│   │   ├── favorites.controller.ts
│   │   ├── reports.controller.ts
│   │   ├── suggestions.controller.ts
│   │   └── admin/
│   │       ├── locations.admin.controller.ts
│   │       ├── categories.admin.controller.ts
│   │       ├── reviews.admin.controller.ts
│   │       ├── reports.admin.controller.ts
│   │       ├── suggestions.admin.controller.ts
│   │       ├── users.admin.controller.ts
│   │       └── audit.admin.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── location.service.ts     ← Location business logic + GIS logic
│   │   ├── category.service.ts
│   │   ├── review.service.ts
│   │   ├── favorite.service.ts
│   │   ├── report.service.ts
│   │   ├── suggestion.service.ts
│   │   ├── upload.service.ts       ← Cloudinary upload logic
│   │   └── geo.service.ts          ← Pure GIS helper functions
│   │
│   ├── repositories/
│   │   ├── location.repository.ts  ← Prisma + PostGIS raw queries
│   │   ├── category.repository.ts
│   │   ├── review.repository.ts
│   │   ├── favorite.repository.ts
│   │   ├── user.repository.ts
│   │   ├── report.repository.ts
│   │   ├── suggestion.repository.ts
│   │   └── audit.repository.ts
│   │
│   ├── middlewares/
│   │   ├── authenticate.middleware.ts   ← JWT verification → req.user
│   │   ├── requireAdmin.middleware.ts   ← Role check (ADMIN only)
│   │   ├── validate.middleware.ts       ← Zod schema validation
│   │   └── error.middleware.ts          ← Global error handler
│   │
│   ├── validations/
│   │   ├── auth.schemas.ts
│   │   ├── location.schemas.ts
│   │   ├── category.schemas.ts
│   │   ├── review.schemas.ts
│   │   └── geo.schemas.ts              ← Coordinate + bbox validation
│   │
│   └── utils/
│       ├── ApiError.ts             ← Custom error class
│       ├── ApiResponse.ts          ← Standardized response builder
│       ├── jwt.ts                  ← signToken + verifyToken
│       ├── hash.ts                 ← bcrypt helpers
│       ├── slug.ts                 ← URL slug generator (ASCII-safe, Turkish-aware)
│       └── geo.ts                  ← Coordinate helpers, bbox validation
│
├── Dockerfile                  ← Multi-stage production build
├── Dockerfile.dev              ← Development image (with ts-node-dev)
├── entrypoint.sh               ← Run migrations → start server
├── package.json
└── tsconfig.json
```

---

## Middleware Stack (in order)

```typescript
// app.ts — Applied in this exact order:

app.use(helmet())                    // Security headers
app.use(cors({ origin: FRONTEND_URL, credentials: true }))
app.use(express.json())              // JSON body parsing
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))               // Request logging (dev only)

app.use('/api/v1', routes)           // All routes

app.use((_req, res) => { res.status(404).json(...) })  // 404
app.use(errorMiddleware)             // Global error handler (must be last)
```

---

## Layered Architecture

### Layer 1: Routes
- Define URL patterns and HTTP method bindings
- Apply middleware chains (authenticate, requireAdmin, validate)
- Delegate to the appropriate controller function
- **Zero business logic**

```typescript
// locations.routes.ts
router.get('/', locationsController.getAll);
router.get('/:slug', locationsController.getBySlug);
router.get('/:id/nearby', locationsController.getNearby);

// Admin routes (separate file, requires admin middleware)
router.post('/', authenticate, requireAdmin, validate(createLocationSchema), adminLocationsController.create);
```

### Layer 2: Controllers
- Extract and type request inputs (params, query, body)
- Call the service
- Format and send the HTTP response
- **No database queries. No business rules.**

```typescript
// locations.controller.ts
export const locationsController = {
  getNearby: async (req: Request, res: Response) => {
    const { lat, lng, radius } = nearbyQuerySchema.parse(req.query);
    const locations = await locationService.getNearby(lat, lng, radius);
    res.json(ApiResponseBuilder.success('Nearby locations fetched.', locations));
  },
};
```

### Layer 3: Services
- Contain all business logic
- Orchestrate calls to one or more repositories
- Throw ApiErrors for business rule violations
- **No direct Prisma or SQL. No HTTP concerns.**

```typescript
// location.service.ts
export const locationService = {
  getNearby: async (lat: number, lng: number, radiusMeters: number) => {
    if (radiusMeters > 50000) throw new ApiError(400, 'Radius cannot exceed 50km.');
    return locationRepository.findNearby(lat, lng, radiusMeters);
  },
};
```

### Layer 4: Repositories
- All database access lives here
- Uses Prisma for standard CRUD
- Uses `prisma.$queryRaw` for PostGIS spatial queries that Prisma cannot express
- **No business rules. No HTTP concerns.**

```typescript
// location.repository.ts
export const locationRepository = {
  findNearby: (lat: number, lng: number, radiusMeters: number) => {
    return prisma.$queryRaw<LocationRow[]>`
      SELECT id, name, category_id,
        ST_Y(geom) AS lat, ST_X(geom) AS lng,
        ROUND(ST_Distance(geom::geography, ST_Point(${lng}, ${lat})::geography)::numeric, 0) AS distance_m
      FROM locations
      WHERE status = 'approved'
        AND ST_DWithin(geom::geography, ST_Point(${lng}, ${lat})::geography, ${radiusMeters})
      ORDER BY distance_m
      LIMIT 20
    `;
  },
};
```

---

## GIS Layer

GIS queries are the most important backend capability. They use PostGIS functions
via `prisma.$queryRaw` with tagged template literals (which parameterize automatically —
no SQL injection risk).

### Core Spatial Queries

| Operation | PostGIS Function | Use Case |
|---|---|---|
| Viewport filter | `ST_MakeEnvelope + &&` | Load markers visible on map |
| Proximity search | `ST_DWithin` | "Find within radius" |
| Distance sort | `ST_Distance` | "Nearest first" ordering |
| Full-text search | `to_tsvector + @@` | Search by name (EN + TR) |
| District filter | `WHERE district = $1` | Filter by Ankara district |
| Coordinate extract | `ST_X(geom), ST_Y(geom)` | Convert geometry to lat/lng |
| Insert geometry | `ST_Point(lng, lat, 4326)` | Store a location's coordinates |
| GeoJSON output | `ST_AsGeoJSON(geom)` | For GeoJSON API responses |

### Geometry Storage

All locations are stored as `GEOMETRY(POINT, 4326)` — WGS84 coordinate system
(the same as GPS coordinates). Latitude and longitude from any source (OSM, admin form, GPS)
map directly to this format.

The GIST index on `geom` makes spatial queries orders of magnitude faster than
doing geometry calculations on every row.

---

## Error Handling

All errors are handled by the global `errorMiddleware` (last middleware in the chain).

```
Thrown:  new ApiError(404, 'Location not found.')
         new ApiError(400, 'Validation failed', { name: ['Required'] })
         new ApiError(403, 'Access denied.')

Caught:  errorMiddleware
         → ApiError → res.status(err.statusCode).json(ApiResponseBuilder.error(...))
         → Prisma P2002 (duplicate) → 409 Conflict
         → Prisma P2025 (not found) → 404 Not Found
         → Unknown error → 500 Internal Server Error (details hidden in production)
```

`express-async-errors` is installed so async functions do not need try/catch —
any thrown error is automatically passed to `errorMiddleware`.

---

## Authentication Architecture

```
POST /api/v1/auth/login
  → authService.login()
  → bcrypt.compare(password, hash)
  → signToken({ userId, role })  ← jwt.sign with JWT_SECRET
  → return { accessToken, refreshToken }

Subsequent requests:
  Authorization: Bearer <accessToken>
  → authenticate middleware
  → jwt.verify(token, JWT_SECRET)
  → req.user = { userId, role }

Admin check:
  → requireAdmin middleware
  → if req.user.role !== 'ADMIN' throw ApiError(403)
```

**Token Strategy:**
- Access token: 24h expiry, stored in memory / localStorage on client
- Refresh token: 7d expiry, stored in HttpOnly cookie (more secure than localStorage)
- On access token expiry: client uses refresh token to get a new access token silently

---

## Audit Logging

Every write operation performed by an Admin is recorded in the `audit_log` table.

```typescript
// In admin services, after every successful write:
await auditRepository.log({
  userId: req.user.userId,
  action: 'UPDATE',
  entityType: 'location',
  entityId: location.id,
  changesJson: { before: oldData, after: newData },
});
```

This provides a complete, tamper-evident history of data changes — important for
a geographic data system where incorrect edits could mislead users.

---

## Cloudinary Image Upload

```
Admin uploads photo:
  POST /api/v1/upload/location/:id

  → Multer (memory storage, 5MB limit, image MIME check)
  → Cloudinary SDK upload
      folder: 'ankara-gis/locations'
      transformation: { quality: 'auto', format: 'auto' }
  → Returns { url, publicId }
  → Controller creates photo record in DB
      { locationId, url, publicId, uploadedBy }
```

Only Admin users can upload location photos.

---

*Document owner: Project team*
*Last updated: 2026-08-13*
