# GIS Architecture

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Overview

GIS (Geographic Information System) functionality is the core differentiator of AnchorMap.
This document describes how geographic data is stored, indexed, queried, and displayed.

The GIS stack:
- **Storage**: PostgreSQL + PostGIS (GEOMETRY type, GIST spatial index)
- **Queries**: PostGIS spatial functions (ST_DWithin, ST_MakeEnvelope, ST_Distance, etc.)
- **Display**: Leaflet.js with OpenStreetMap tiles and Leaflet.markercluster
- **Data source**: OpenStreetMap via Geofabrik Turkey extract

---

## Coordinate System

All location coordinates are stored in **WGS84** (EPSG:4326), the same coordinate system
used by GPS devices, Google Maps, and OpenStreetMap.

- **Latitude**: North-South position. Ankara: approximately 39.5° to 40.2° N
- **Longitude**: East-West position. Ankara: approximately 32.3° to 33.1° E
- **Point geometry**: `GEOMETRY(POINT, 4326)` — stores a single (lng, lat) pair

PostGIS stores coordinates internally as (x, y) = (longitude, latitude).
This is the opposite of the conventional (lat, lng) notation.
All code must be explicit: `ST_Point(longitude, latitude)` — NOT `ST_Point(latitude, longitude)`.

---

## PostGIS Column Definition

```sql
-- In the locations table:
geom GEOMETRY(POINT, 4326) NOT NULL
```

When inserting from the backend:
```sql
-- Backend sends lat and lng as separate values
-- PostGIS Point takes (x=lng, y=lat)
UPDATE locations SET geom = ST_SetSRID(ST_MakePoint($lng, $lat), 4326)
```

When reading coordinates back:
```sql
SELECT
  id, name,
  ST_Y(geom) AS lat,   -- Y = latitude
  ST_X(geom) AS lng    -- X = longitude
FROM locations;
```

---

## Spatial Indexes

```sql
-- Primary spatial index (required for all spatial queries to be fast)
CREATE INDEX locations_geom_gist ON locations USING GIST(geom);

-- Full-text search index (English)
CREATE INDEX locations_fts_en ON locations
  USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Full-text search index (Turkish)
CREATE INDEX locations_fts_tr ON locations
  USING GIN(to_tsvector('turkish', COALESCE(name_tr, name) || ' ' || COALESCE(description_tr, '')));

-- Trigram index for partial search
CREATE INDEX locations_name_trgm ON locations USING GIN(name gin_trgm_ops);
CREATE INDEX locations_name_tr_trgm ON locations USING GIN(name_tr gin_trgm_ops);
```

The GIST index is what makes spatial queries like ST_DWithin and ST_MakeEnvelope fast.
Without it, every spatial query would require a full table scan — unacceptable at scale.

---

## Core Spatial Queries

### 1. Viewport Bounding Box (Map Pan/Zoom)

When the user pans or zooms the map, the frontend sends the current viewport
bounding box. The backend fetches only locations within that area.

```sql
-- Fetch all approved locations within the current map viewport
SELECT
  id, name, name_tr, category_id, slug,
  ST_Y(geom) AS lat,
  ST_X(geom) AS lng,
  avg_rating, review_count
FROM locations
WHERE status = 'approved'
  AND geom && ST_MakeEnvelope($minLng, $minLat, $maxLng, $maxLat, 4326)
  AND ($categoryId IS NULL OR category_id = $categoryId)
LIMIT 200;
```

The `&&` operator uses the GIST index for fast bounding-box intersection.
The `LIMIT 200` prevents excessive marker rendering even if the viewport is very wide.

### 2. Proximity / Nearby Search

```sql
-- Find locations within $radiusMeters of a given coordinate, sorted by distance
SELECT
  id, name, name_tr, category_id, slug,
  ST_Y(geom) AS lat,
  ST_X(geom) AS lng,
  ROUND(
    ST_Distance(geom::geography, ST_Point($lng, $lat)::geography)::numeric,
    0
  ) AS distance_m
FROM locations
WHERE status = 'approved'
  AND ST_DWithin(
    geom::geography,
    ST_Point($lng, $lat)::geography,
    $radiusMeters
  )
  AND ($categoryId IS NULL OR category_id = $categoryId)
ORDER BY distance_m ASC
LIMIT 20;
```

**Important**: The `::geography` cast converts from geometry (flat, degree-based) to
geography (spherical, meter-based). This is required for accurate real-world distance
calculations in meters. Without this cast, ST_Distance returns degrees, not meters.

### 3. Full-Text Search (English + Turkish)

```sql
-- Search by name (supports Turkish characters via unaccent + pg_trgm)
SELECT id, name, name_tr, category_id, slug,
  ST_Y(geom) AS lat, ST_X(geom) AS lng
FROM locations
WHERE status = 'approved'
  AND (
    name ILIKE '%' || $query || '%'
    OR name_tr ILIKE '%' || $query || '%'
    OR to_tsvector('english', name) @@ plainto_tsquery('english', $query)
    OR to_tsvector('turkish', COALESCE(name_tr, name)) @@ plainto_tsquery('turkish', $query)
  )
LIMIT 50;
```

### 4. District Filter

```sql
SELECT id, name, name_tr, category_id, slug,
  ST_Y(geom) AS lat, ST_X(geom) AS lng
FROM locations
WHERE status = 'approved'
  AND district = $district
  AND ($categoryId IS NULL OR category_id = $categoryId)
ORDER BY name ASC;
```

### 5. Inserting a New Location

```sql
-- From admin create or import script
INSERT INTO locations (
  id, name, name_tr, slug, category_id, geom, district, status, source, ...
) VALUES (
  gen_random_uuid(),
  $name, $nameTr, $slug, $categoryId,
  ST_SetSRID(ST_MakePoint($lng, $lat), 4326),
  $district, 'approved', 'manual', ...
);
```

---

## Leaflet.js Integration

Leaflet is the map rendering library. It handles:
- Fetching and displaying OSM base map tiles
- Rendering location markers (custom icons per category)
- Marker clustering (Leaflet.markercluster plugin)
- GeoJSON overlay for district boundaries
- User click interactions → sidebar panel

### Data Flow: Backend → Leaflet

```
API returns: [{ id, name, lat, lng, category_id, ... }, ...]

Frontend transforms to Leaflet markers:
  locations.forEach(loc => {
    const icon = getCategoryIcon(loc.category_id);
    const marker = L.marker([loc.lat, loc.lng], { icon })
      .bindPopup(renderPopup(loc))
      .on('click', () => selectLocation(loc.id));
    markerClusterGroup.addLayer(marker);
  });
```

### Viewport-Based Loading

Leaflet fires a `moveend` event when the user finishes panning or zooming.
The frontend reads the new bounds and calls the API with the new bounding box.
This is the primary performance optimization — we never load the full dataset at once.

```typescript
map.on('moveend', async () => {
  const bounds = map.getBounds();
  const bbox = {
    minLng: bounds.getWest(),
    minLat: bounds.getSouth(),
    maxLng: bounds.getEast(),
    maxLat: bounds.getNorth(),
  };
  const locations = await api.get('/locations', { params: { ...bbox, ...filters } });
  updateMarkers(locations.data.data);
});
```

### District Overlay

Ankara district boundaries are stored as a static GeoJSON file at
`public/geodata/ankara-districts.geojson`. This file is fetched once and
rendered as a transparent polygon layer on the map.

```typescript
fetch('/geodata/ankara-districts.geojson')
  .then(r => r.json())
  .then(data => {
    districtLayer = L.geoJSON(data, {
      style: { color: '#2563eb', weight: 1, fillOpacity: 0.05 }
    });
    // Toggle on/off via button
  });
```

---

## Geographic Data Categories

OSM uses `amenity`, `tourism`, `historic`, `leisure`, and other tags to classify places.
The import script maps these to our internal categories.

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

## Ankara Geographic Boundaries

| Property | Value |
|---|---|
| Bounding box min lat | 39.50° N |
| Bounding box max lat | 40.20° N |
| Bounding box min lng | 32.30° E |
| Bounding box max lng | 33.10° E |
| Map center | 39.9334° N, 32.8597° E |
| Initial zoom level | 12 |
| Admin districts | 25 (ilçe) |

The bounding box is used to:
1. Validate coordinates during import (reject anything outside Ankara)
2. Validate coordinates submitted by admin users
3. Constrain the map's maximum zoom-out (prevent loading non-Ankara data)

---

## PostGIS Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS postgis;      -- Core GIS
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- Trigram index (fuzzy search)
CREATE EXTENSION IF NOT EXISTS unaccent;     -- Turkish character normalization
```

On Supabase, PostGIS is enabled by default.
`pg_trgm` and `unaccent` can be enabled from the Supabase dashboard
(Database → Extensions) or via migration SQL.

---

*Document owner: Project team*
*Last updated: 2026-08-13*
*See also: [ADR-003](../80-adr/ADR-003-postgresql-postgis.md), [ADR-004](../80-adr/ADR-004-supabase-hosting.md)*
