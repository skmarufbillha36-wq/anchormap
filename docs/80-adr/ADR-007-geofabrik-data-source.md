# ADR-007: Geofabrik as OSM Data Source

**Status:** Accepted
**Date:** 2026-08-13

---

## Context

We need to seed the database with thousands of real Ankara locations from OpenStreetMap.
We need to choose between querying the Overpass API directly and downloading a Geofabrik extract.

---

## Decision

We use **Geofabrik's Turkey regional extract** as the OSM data source.

---

## Rationale

**Overpass API Is Not Designed for Bulk Downloads**

The Overpass API is designed for targeted queries (e.g., "find all hospitals in this bbox").
Querying all POI types for an entire city the size of Ankara causes:
- Frequent 429 Too Many Requests errors (rate limiting)
- Server-side timeouts for large result sets
- Incomplete results if the query times out mid-execution
- Risk of violating Overpass API fair-use policy

**Geofabrik Is Designed Exactly for This Use Case**

Geofabrik provides daily-updated, pre-compiled OSM extracts as `.osm.pbf` files.
The Turkey extract is reliable, complete, and includes all 25 Ankara districts.

**One-Time Download, Not a Runtime Dependency**

The import is a one-time operation during initial setup. After the database is seeded,
the application has no runtime dependency on Geofabrik or OSM. This eliminates a
class of production failures (external API down → import fails → no data).

**osmium-tool for Efficient Filtering**

After downloading the Turkey extract (~650MB), `osmium extract` filters it to the
Ankara bounding box in seconds, producing a ~25-50MB Ankara-specific file.
This is far faster than trying to query the Overpass API category by category.

---

## Consequences

**Positive:**
- Reliable, complete Ankara dataset
- No API rate limiting
- No runtime external dependency
- One-time download (not repeated)

**Negative:**
- ~650MB initial download (Turkey extract)
- Requires `osmium-tool` CLI tool installed locally
- Data snapshot, not real-time (acceptable — Admin review workflow handles freshness)
