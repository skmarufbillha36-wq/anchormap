# ADR-003: PostgreSQL + PostGIS as the Geographic Database

**Status:** Accepted
**Date:** 2026-08-13

---

## Context

A GIS application requires a database capable of storing geographic coordinates,
performing spatial queries (proximity search, radius filtering, bounding box intersection),
and indexing geographic data for performance. We needed to select the appropriate database technology.

Options considered:
1. **PostgreSQL + PostGIS** — Relational database with spatial extension
2. **MongoDB** — Document database with geospatial support
3. **SQLite + SpatiaLite** — Embedded spatial database
4. **MySQL + spatial extensions** — Relational database with limited spatial support

---

## Decision

We use **PostgreSQL 15 with the PostGIS 3 extension**.

---

## Rationale

### PostGIS Is the Industry Standard for GIS

PostGIS is used by governments, mapping agencies, GIS software vendors, and production
GIS applications worldwide. It implements the full OGC Simple Features specification
and provides hundreds of spatial functions.

For a GIS university project, using PostGIS signals genuine technical knowledge —
not just storing lat/lng as numbers.

### Required PostGIS Capabilities We Use

- `GEOMETRY(POINT, 4326)` — proper geographic type (not just two float columns)
- `GIST` spatial index — makes proximity/bbox queries fast at any scale
- `ST_DWithin` — fast radius/proximity search with proper geography (spherical Earth)
- `ST_MakeEnvelope` — bounding box queries for viewport-based map loading
- `ST_Distance` — real-world distance calculations in meters
- `ST_Point` + `ST_SetSRID` — correct coordinate insertion
- `to_tsvector` + `GIN` index — Turkish full-text search

### PostgreSQL Already Chosen for the Backend

The project uses Prisma ORM with PostgreSQL. Adding PostGIS is a single `CREATE EXTENSION`
statement — no additional infrastructure is required.

### Future-Proof for Polygon/Line Support

If we later add district polygons, campus areas, or routing polylines,
PostGIS already supports `GEOMETRY(POLYGON)`, `GEOMETRY(LINESTRING)`, and more complex
types without any database migration complexity.

---

## Alternatives Rejected

**MongoDB:**
Despite having GeoJSON support and `$geoNear` queries, MongoDB does not match the
relational data model needed for users, reviews, favorites, and audit logs.
The team has no MongoDB experience. Prisma ORM's primary target is PostgreSQL.

**SQLite + SpatiaLite:**
Suitable for single-user or embedded applications. Cannot handle concurrent writes from
multiple users. Not supported by Supabase (our hosting choice). Not production-grade
for a multi-user web application.

**MySQL:**
MySQL's spatial support is significantly weaker than PostGIS. It lacks the rich function
library, lacks proper geographic distance calculations (`::geography` cast), and is
not supported by the Supabase hosting platform.
