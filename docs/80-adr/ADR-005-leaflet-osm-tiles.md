# ADR-005: Leaflet.js + OpenStreetMap Tiles as the Map Stack

**Status:** Accepted
**Date:** 2026-08-13

---

## Context

The application requires an interactive map library to display thousands of geographic
markers with clustering, popups, GeoJSON overlays, and viewport-based data loading.

Options considered:
1. **Leaflet.js + OpenStreetMap tiles** — Free, open-source, no API key
2. **Mapbox GL JS** — Premium quality, requires API key + billing account
3. **Google Maps JavaScript API** — Familiar, requires billing even on free tier
4. **OpenLayers** — Open-source, more complex API, enterprise-focused

---

## Decision

We use **Leaflet.js** as the map library with **OpenStreetMap tiles** as the base map.

---

## Rationale

### No API Key Required

OpenStreetMap tile layers (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
are free to use with attribution. No account, no API key, no billing.

Mapbox and Google Maps both require account registration and billing setup.
For a free-tier university project, this is an unnecessary dependency and risk
(billing surprises if free tier is exceeded).

### Leaflet Is Production-Quality

Leaflet is used in production by major GIS applications, government mapping portals,
and thousands of web applications. It has:
- 36,000+ GitHub stars
- First-class TypeScript definitions (`@types/leaflet`)
- Rich plugin ecosystem (`Leaflet.markercluster`, `Leaflet.heat`, `Leaflet.draw`)
- Active maintenance

### Marker Clustering

`Leaflet.markercluster` is a mature, widely-used plugin that handles thousands of
markers gracefully. Without clustering, 2,000+ location markers would make the browser
unusable at low zoom levels. The plugin aggregates nearby markers into numbered clusters
that expand on zoom.

### OSM Data Consistency

Our geographic data comes from OpenStreetMap (via Geofabrik). Using OSM base tiles
creates a consistent visual experience — the map tiles and our marker data come from
the same source and are always in sync.

### GeoJSON Support

Leaflet has native GeoJSON support via `L.geoJSON()`. Rendering district boundary polygons
requires no additional plugins.

---

## Important Implementation Note

Leaflet requires the browser `window` object and **cannot be server-side rendered**.
All Leaflet components in Next.js must be wrapped with:

```typescript
import dynamic from 'next/dynamic';
const Map = dynamic(() => import('./Map'), { ssr: false });
```

This is documented in the Frontend Architecture document and is a standard, well-known
requirement for using Leaflet with Next.js.

---

## Alternatives Rejected

**Mapbox GL JS:**
Excellent visual quality, 3D building support, vector tiles. However, requires a
Mapbox account and API key, and billing if the free tier is exceeded. For a project
committed to free-tier deployment, this is an unacceptable dependency. Considered for Phase 2.

**Google Maps JavaScript API:**
Requires billing account setup even on the free tier. Limited to 28,000 map loads/month
on free tier. Terms of service restrict caching and data extraction from the map.
Incompatible with our OSM-sourced data philosophy.

**OpenLayers:**
More powerful than Leaflet for complex WMS/WFS data layers, but significantly more
complex API. Designed for enterprise GIS applications. Overkill for our use case and
would slow development significantly.
