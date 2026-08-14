# OSM Data Import Strategy

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Overview

The initial dataset of Ankara locations is sourced from **OpenStreetMap (OSM)** via a
Geofabrik regional extract. This is a one-time import that seeds the database with
thousands of real, geographically accurate locations across all 25 Ankara districts.

After import, all records start as `status = 'pending'` and must be approved by an Admin
before appearing on the public map. This provides a quality gate for the imported data.

---

## Why Geofabrik Instead of Overpass API

The Overpass API is designed for small, targeted queries. Querying all amenity types
for an entire city (Ankara has ~6.5M population) causes frequent timeouts, rate limiting,
and incomplete results.

Geofabrik provides **daily-updated, pre-compiled OSM extracts** as `.osm.pbf` binary files.
The Turkey extract is reliable, complete, and can be downloaded once for local processing.

See [ADR-007](../80-adr/ADR-007-geofabrik-data-source.md) for the full rationale.

---

## Import Pipeline

```
Step 1: DOWNLOAD
  URL: https://download.geofabrik.de/europe/turkey-latest.osm.pbf
  Size: ~650MB
  Frequency: Once (before launch)

Step 2: FILTER TO ANKARA
  Tool: osmium-tool (osmium extract)
  Command: osmium extract --bbox=32.30,39.50,33.10,40.20 turkey-latest.osm.pbf -o ankara.osm.pbf
  Result: ~25-50MB Ankara-only extract

Step 3: RUN IMPORT SCRIPT
  Script: docs/scripts/import-osm.ts (or import-osm.py)
  Input: ankara.osm.pbf
  Output: SQL INSERT statements → database

Step 4: ADMIN REVIEW
  Admin opens /admin/import
  Bulk-approves high-confidence categories (hospitals, universities)
  Reviews borderline records individually
  Rejects clearly invalid records

Step 5: GO LIVE
  Approved locations appear on the public map
```

---

## Import Script Logic

The import script (`docs/scripts/import-osm.ts`) implements the following pipeline per OSM feature:

```
1. Parse feature from .osm.pbf
2. Check: does this feature have a relevant amenity/tourism/historic tag?
   → No: skip
3. Extract: name, name:tr, lat, lng, osm_id, osm_type, all tags
4. Validate: lat ∈ [39.50, 40.20], lng ∈ [32.30, 33.10]
   → Out of bounds: skip
5. Check: name is not empty (or has a meaningful tag)
   → No name and no usable tag: skip
6. Map OSM tag → internal category_id (see mapping table below)
   → No matching category: assign to 'Other' or skip (configurable)
7. Check: osm_id not already in database
   → Already exists: skip (idempotent re-import support)
8. Generate URL slug from name (ASCII-safe, deduplicated)
9. Insert into locations with:
     status = 'pending'
     source = 'osm'
     osm_id = <id>
     osm_type = 'node' | 'way' | 'relation'
10. Log result: inserted | skipped (duplicate) | skipped (no match) | rejected (invalid)
```

---

## OSM Tag → Category Mapping

| OSM Tag(s) | Internal Category | Subcategory |
|---|---|---|
| `amenity=university` | Education | University |
| `amenity=college` | Education | University |
| `amenity=school` | Education | School |
| `amenity=kindergarten` | Education | Kindergarten |
| `amenity=library` | Education | Library |
| `amenity=hospital` | Healthcare | Hospital |
| `amenity=clinic` | Healthcare | Clinic |
| `amenity=doctors` | Healthcare | Clinic |
| `amenity=pharmacy` | Healthcare | Pharmacy |
| `amenity=dentist` | Healthcare | Dentist |
| `amenity=veterinary` | Healthcare | Veterinary |
| `amenity=police` | Emergency & Security | Police Station |
| `amenity=fire_station` | Emergency & Security | Fire Station |
| `emergency=*` | Emergency & Security | Emergency Facility |
| `amenity=post_office` | Public Services | Post Office |
| `office=government` | Public Services | Government Office |
| `office=tax` | Public Services | Tax Office |
| `amenity=courthouse` | Public Services | Government Office |
| `amenity=townhall` | Public Services | Municipality |
| `government=*` | Public Services | Government Office |
| `amenity=bank` | Public Services | Bank |
| `tourism=museum` | Historical & Cultural | Museum |
| `historic=castle` | Historical & Cultural | Historical Building |
| `historic=building` | Historical & Cultural | Historical Building |
| `historic=monument` | Historical & Cultural | Monument |
| `historic=archaeological_site` | Historical & Cultural | Archaeological Site |
| `historic=ruins` | Historical & Cultural | Historical Building |
| `amenity=place_of_worship` + `religion=muslim` | Historical & Cultural | Mosque |
| `amenity=place_of_worship` + `religion=christian` | Historical & Cultural | Church |
| `amenity=arts_centre` | Historical & Cultural | Cultural Center |
| `amenity=theatre` | Historical & Cultural | Cultural Center |
| `tourism=attraction` | Tourism & Recreation | Tourist Attraction |
| `tourism=viewpoint` | Tourism & Recreation | Viewpoint |
| `tourism=hotel` | Tourism & Recreation | Hotel |
| `tourism=hostel` | Tourism & Recreation | Hotel |
| `tourism=information` | Tourism & Recreation | Tourist Information |
| `leisure=park` | Tourism & Recreation | Park |
| `leisure=garden` | Tourism & Recreation | Park |
| `leisure=nature_reserve` | Tourism & Recreation | Park |

---

## Data Quality Considerations

### Expected OSM Data Issues

| Issue | Frequency | Handling |
|---|---|---|
| No `name` tag | Common (10-20%) | Skip during import; log |
| Name only in Turkish (`name:tr` but no `name`) | Common | Use `name:tr` as `name`, log |
| Duplicate point + polygon | Common | Use polygon centroid as point; skip duplicate node |
| Wrong coordinates (outliers) | Rare | Reject via bounding box check |
| Outdated data (closed businesses) | Moderate | Admin review resolves |
| Missing category assignment | Rare | Manual admin assignment |

### Idempotency

The import uses `osm_id` as a deduplication key with a UNIQUE constraint.
Re-running the import script will:
- Insert new records not yet in the database
- Skip records already present (same `osm_id`)
- Never create duplicates

This means the import can be safely re-run if it fails partway through.

---

## Expected Import Volume (Estimate)

Based on OSM coverage analysis for Ankara province:

| Category | Estimated Records |
|---|---|
| Education | 600-900 |
| Healthcare | 400-700 |
| Emergency & Security | 150-250 |
| Public Services | 300-500 |
| Historical & Cultural | 200-400 |
| Tourism & Recreation | 300-600 |
| **Total (raw)** | **~2,000-3,500** |
| After filtering (name + bounds) | ~1,500-2,500 |
| After admin approval (est. 70%) | ~1,000-1,800 |

---

## Running the Import

### Prerequisites
- Node.js 20+ or Python 3.10+
- `osmium-tool` installed (`npm install osmium` or system package)
- Database running and accessible
- `DATABASE_URL` environment variable set

### Commands

```bash
# Step 1: Download Turkey extract
# (Run once, ~650MB download)
curl -O https://download.geofabrik.de/europe/turkey-latest.osm.pbf

# Step 2: Extract Ankara
osmium extract --bbox=32.30,39.50,33.10,40.20 turkey-latest.osm.pbf -o ankara.osm.pbf

# Step 3: Run import
# From the project root:
npx ts-node docs/scripts/import-osm.ts --input ankara.osm.pbf

# Or with Python:
python docs/scripts/import_osm.py --input ankara.osm.pbf
```

### Import Output

```
🗺️  AnchorMap OSM Import
=======================
Input: ankara.osm.pbf
Database: postgresql://...@supabase/postgres

Processing nodes...
Processing ways...
Processing relations...

Results:
  ✅ Inserted:  2,341 locations (status: pending)
  ⏭️  Skipped (duplicate osm_id):  0
  ⏭️  Skipped (no name):  892
  ⏭️  Skipped (no category match):  156
  ❌ Rejected (out of bounds):  14

Next step: Open /admin/import to review and approve locations.
```

---

## Post-Import Admin Workflow

After the import script completes:

1. Admin logs into `/admin/import`
2. Sees a table of all `pending` locations grouped by category
3. **Bulk approve high-confidence categories**: Hospitals, Universities, Police Stations
4. **Individual review for borderline records**: small clinics, unverified historical sites
5. **Reject**: records with clearly wrong data or no useful information
6. Approved locations appear immediately on the public map

---

*Document owner: Project team*
*Last updated: 2026-08-13*
*See also: [ADR-007](../80-adr/ADR-007-geofabrik-data-source.md), [Database Schema](./01-database-schema.md)*
