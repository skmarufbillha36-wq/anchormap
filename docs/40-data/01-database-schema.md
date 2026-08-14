# Database Schema

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Overview

The database is **PostgreSQL 15 with the PostGIS 3 extension**, hosted on Supabase.
The Prisma ORM manages schema migrations. PostGIS spatial queries are executed
via `prisma.$queryRaw` where Prisma's standard API cannot express geographic functions.

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS postgis;   -- Geographic types + functions
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- Trigram similarity (fuzzy search)
CREATE EXTENSION IF NOT EXISTS unaccent;  -- Remove diacritics (Turkish chars)
```

---

## Tables

### `users`

Stores all user accounts (visitors who register, admins).

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  avatar_url      TEXT,
  password_hash   TEXT,                        -- NULL for OAuth users
  role            TEXT NOT NULL DEFAULT 'USER'
                    CHECK (role IN ('USER', 'ADMIN')),
  provider        TEXT NOT NULL DEFAULT 'email'
                    CHECK (provider IN ('email', 'google')),
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Notes:**
- `password_hash` is NULL for Google OAuth users (they have no password)
- `email_verified` is always TRUE for Google OAuth users
- Only one `ADMIN` role in Phase 1; promotion is manual via Admin Dashboard

---

### `categories`

Defines the classification system for locations. Supports two levels (parent + child).

```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,                   -- English display name
  name_tr     TEXT,                            -- Turkish display name
  slug        TEXT UNIQUE NOT NULL,            -- URL identifier (e.g., 'healthcare')
  icon        TEXT,                            -- Icon identifier (e.g., 'heart-pulse')
  color       TEXT,                            -- Hex color (e.g., '#ef4444')
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Category hierarchy** (parent → child):
```
Education → University, School, Kindergarten, Library
Healthcare → Hospital, Clinic, Pharmacy, Dentist, Veterinary
Emergency & Security → Police Station, Fire Station, Emergency Hospital
Public Services → Government Office, Municipality, Post Office, Tax Office
Historical & Cultural → Museum, Historical Building, Monument, Mosque, Archaeological Site, Cultural Center
Tourism & Recreation → Tourist Attraction, Famous Landmark, Park, Viewpoint, Hotel, Tourist Information
```

---

### `locations`

**The core GIS table.** Every geographic point of interest in Ankara.

```sql
CREATE TABLE locations (
  -- Identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_id          BIGINT UNIQUE,               -- OpenStreetMap ID (prevents re-import duplicates)
  osm_type        TEXT,                        -- 'node' | 'way' | 'relation'
  slug            TEXT UNIQUE NOT NULL,        -- URL-safe identifier

  -- Bilingual names
  name            TEXT NOT NULL,               -- English name (primary)
  name_tr         TEXT,                        -- Turkish name (secondary)

  -- Classification
  category_id     UUID NOT NULL REFERENCES categories(id),
  subcategory     TEXT,                        -- Free-text sub-classification

  -- Geographic data (THE CORE)
  geom            GEOMETRY(POINT, 4326) NOT NULL,  -- WGS84 point (lng, lat)
  district        TEXT,                        -- Ankara district (ilçe)
  address         TEXT,                        -- Street address

  -- Bilingual descriptions
  description     TEXT,                        -- English description
  description_tr  TEXT,                        -- Turkish description

  -- Contact
  phone           TEXT,
  website         TEXT,
  email           TEXT,
  instagram       TEXT,

  -- Opening hours (structured JSON)
  hours_json      JSONB,                       -- See hours format below

  -- Metadata
  tags            TEXT[],                      -- Flexible keyword tags
  accessibility   TEXT,                        -- Wheelchair/accessibility notes
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'deleted')),
  source          TEXT NOT NULL DEFAULT 'osm'
                    CHECK (source IN ('osm', 'manual', 'user_suggestion')),

  -- Denormalized stats (updated by trigger or background job)
  avg_rating      NUMERIC(3, 2),
  review_count    INT NOT NULL DEFAULT 0,

  -- Audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES users(id)
);

-- INDEXES

-- Primary spatial index (required for all bbox/proximity queries)
CREATE INDEX locations_geom_gist ON locations USING GIST(geom);

-- Composite index for common admin/status queries
CREATE INDEX locations_status_idx ON locations(status);
CREATE INDEX locations_category_status_idx ON locations(category_id, status);
CREATE INDEX locations_district_idx ON locations(district);

-- Full-text search indexes
CREATE INDEX locations_fts_en ON locations
  USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX locations_fts_tr ON locations
  USING GIN(to_tsvector('turkish', COALESCE(name_tr, name)));

-- Trigram indexes for partial name search
CREATE INDEX locations_name_trgm ON locations USING GIN(name gin_trgm_ops);
CREATE INDEX locations_name_tr_trgm ON locations USING GIN(name_tr gin_trgm_ops);
```

**Opening Hours JSON Format:**
```json
{
  "monday":    { "open": "08:00", "close": "17:00", "closed": false },
  "tuesday":   { "open": "08:00", "close": "17:00", "closed": false },
  "wednesday": { "open": "08:00", "close": "17:00", "closed": false },
  "thursday":  { "open": "08:00", "close": "17:00", "closed": false },
  "friday":    { "open": "08:00", "close": "17:00", "closed": false },
  "saturday":  { "open": "09:00", "close": "13:00", "closed": false },
  "sunday":    { "open": null,    "close": null,    "closed": true  }
}
```

---

### `photos`

Location photos stored via Cloudinary CDN.

```sql
CREATE TABLE photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,         -- Cloudinary CDN URL
  public_id     TEXT NOT NULL,         -- Cloudinary public_id (for deletion)
  caption       TEXT,
  caption_tr    TEXT,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX photos_location_idx ON photos(location_id);
```

---

### `reviews`

User-generated ratings and comments for locations.

```sql
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content       TEXT,                  -- Review text (optional)
  status        TEXT NOT NULL DEFAULT 'published'
                  CHECK (status IN ('published', 'hidden', 'flagged')),
  flag_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One review per user per location
  UNIQUE(location_id, user_id)
);

CREATE INDEX reviews_location_idx ON reviews(location_id);
CREATE INDEX reviews_user_idx ON reviews(user_id);
CREATE INDEX reviews_status_idx ON reviews(status);
```

---

### `favorites`

User-saved locations.

```sql
CREATE TABLE favorites (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, location_id)
);

CREATE INDEX favorites_user_idx ON favorites(user_id);
```

---

### `reports`

User-submitted reports of inaccurate location data.

```sql
CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  reporter_id   UUID REFERENCES users(id),
  type          TEXT CHECK (type IN (
                  'wrong_location', 'wrong_info', 'permanently_closed',
                  'duplicate', 'inappropriate', 'other'
                )),
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by   UUID REFERENCES users(id),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reports_location_idx ON reports(location_id);
CREATE INDEX reports_status_idx ON reports(status);
```

---

### `suggestions`

User-submitted proposals for new locations (pending admin approval).

```sql
CREATE TABLE suggestions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_by  UUID REFERENCES users(id),
  name          TEXT NOT NULL,
  name_tr       TEXT,
  category_id   UUID REFERENCES categories(id),
  lat           NUMERIC(10, 7) NOT NULL,
  lng           NUMERIC(10, 7) NOT NULL,
  address       TEXT,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  location_id   UUID REFERENCES locations(id),  -- Set if approved and location created
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `audit_log`

Immutable record of all Admin write actions.

```sql
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  action        TEXT NOT NULL
                  CHECK (action IN (
                    'CREATE', 'UPDATE', 'DELETE', 'RESTORE',
                    'APPROVE', 'REJECT', 'HIDE', 'FLAG', 'PROMOTE'
                  )),
  entity_type   TEXT NOT NULL
                  CHECK (entity_type IN (
                    'location', 'category', 'review', 'user', 'suggestion', 'report'
                  )),
  entity_id     UUID,
  changes_json  JSONB,              -- { before: {...}, after: {...} }
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_entity_idx ON audit_log(entity_type, entity_id);
CREATE INDEX audit_log_user_idx ON audit_log(user_id);
CREATE INDEX audit_log_created_idx ON audit_log(created_at DESC);
```

---

## Entity Relationship Diagram (Text)

```
users
  ├── reviews (user_id → users.id)
  ├── favorites (user_id → users.id)
  ├── reports (reporter_id → users.id)
  ├── suggestions (suggested_by → users.id)
  ├── photos (uploaded_by → users.id)
  ├── locations (created_by → users.id)
  └── audit_log (user_id → users.id)

categories
  ├── categories (parent_id → categories.id)  [self-referential]
  └── locations (category_id → categories.id)

locations
  ├── photos (location_id → locations.id)
  ├── reviews (location_id → locations.id)
  ├── favorites (location_id → locations.id)
  ├── reports (location_id → locations.id)
  └── suggestions (location_id → locations.id) [when approved]
```

---

## Migration Strategy

1. Prisma Migrate manages all schema changes (version-controlled `.sql` migration files)
2. Migrations run automatically in the Docker entrypoint (`prisma migrate deploy`)
3. PostGIS-specific SQL (CREATE EXTENSION, GIST indexes) is in the initial migration file
4. Never edit the database schema directly in production — always create a new migration

---

*Document owner: Project team*
*Last updated: 2026-08-13*
*See also: [GIS Architecture](../10-architecture/04-gis-architecture.md)*
