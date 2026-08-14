# AnchorMap — OSM Data Import Architecture

## Overview

AnchorMap imports Ankara POI (Point of Interest) data from [OpenStreetMap](https://www.openstreetmap.org/)
via the [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API), processes it in Node.js,
and stores it in a PostGIS-enabled PostgreSQL database with full spatial enrichment.

**Data source attribution:** © OpenStreetMap contributors, ODbL license  
**License:** [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/)  
**Attribution page:** https://www.openstreetmap.org/copyright

---

## Architecture

```
Overpass API
    │
    │  [out:json][timeout:180]; (bbox: Ankara province)
    │  node/way per category tag → out center tags;
    ▼
scripts/import_container.mjs     ← main importer (Node.js ESM)
    │
    ├─ Tag extraction (all relevant OSM fields)
    ├─ Category classification (RULES table → category_id)
    ├─ Address assembly (addr:street + housenumber + neighbourhood + district + postcode + city)
    ├─ opening_hours → hours_json {raw: "..."} 
    ├─ wheelchair → accessibility field
    ├─ Classification tags → tags[] array
    ├─ Subcategory from healthcare/historic/tourism sub-tags
    └─ Bulk INSERT with ON CONFLICT(osm_id) DO NOTHING
         │
         ▼
    PostGIS locations table
         │
         ▼
scripts/enrich_districts.mjs     ← spatial enrichment (Node.js ESM)
    │
    ├─ Downloads Ankara admin_level=6 boundaries from Overpass
    ├─ Stitches way segments into closed polygons (linearMerge algorithm)
    ├─ Imports to ankara_districts PostGIS table
    ├─ ST_MakeValid() to fix self-intersections
    └─ UPDATE locations SET district = d.name FROM ankara_districts d
         WHERE ST_Within(l.geom, d.geom)
```

---

## OSM Tag Mapping

### Category Classification

| OSM tag:value | AnchorMap category |
|---|---|
| `amenity=university`, `amenity=college` | university |
| `amenity=school` | school |
| `amenity=kindergarten` | kindergarten |
| `amenity=library` | library |
| `amenity=hospital` | hospital |
| `amenity=clinic` | clinic |
| `amenity=pharmacy` | pharmacy |
| `amenity=dentist` | dentist |
| `amenity=veterinary` | veterinary |
| `amenity=police` | police-station |
| `amenity=fire_station` | fire-station |
| `amenity=townhall` | municipality |
| `amenity=post_office` | post-office |
| `amenity=bank` | bank |
| `office=government` | government-office |
| `tourism=museum` | museum |
| `historic=castle`, `historic=ruins` | historical-building |
| `historic=archaeological_site` | archaeological-site |
| `historic=monument`, `historic=memorial` | monument |
| `amenity=place_of_worship` | mosque |
| `amenity=arts_centre`, `amenity=theatre`, `amenity=cinema` | cultural-center |
| `tourism=attraction` | tourist-attraction |
| `tourism=viewpoint` | viewpoint |
| `tourism=hotel`, `tourism=hostel`, `tourism=guest_house` | hotel |
| `leisure=park`, `leisure=garden` | park |
| `tourism=information` | tourist-information |

### Field Mapping

| OSM tag(s) | DB column | Notes |
|---|---|---|
| `name` / `name:en` / `int_name` | `name` | First non-null wins |
| `name:tr` / `name` | `name_tr` | Turkish name |
| `addr:street` + `addr:housenumber` + `addr:neighbourhood` + `addr:district` + `addr:postcode` + `addr:city` | `address` | Assembled intelligently, only present parts |
| `addr:district` | `district` | Fallback only; overwritten by spatial join |
| `addr:postcode` | `addr_postcode` | New field added in v2 |
| `phone` / `contact:phone` | `phone` | First non-null wins |
| `website` / `contact:website` | `website` | First non-null wins |
| `email` / `contact:email` | `email` | First non-null wins |
| `opening_hours` | `hours_json` (JSONB) | Stored as `{"raw": "Mo-Fr 09:00-18:00"}` |
| `wheelchair` | `accessibility` | Mapped: yes→`wheelchair_yes`, no→`wheelchair_no`, limited→`wheelchair_limited` |
| `operator` / `brand` | `operator` | New field added in v2 |
| `description` / `description:en` | `description` | Rarely available in OSM |
| `healthcare` / `historic` / `tourism` / etc. | `subcategory` | e.g. `healthcare:hospital`, `historic:castle` |
| all classification tags | `tags[]` | e.g. `["amenity:hospital", "healthcare:hospital", "emergency:yes"]` |

### Fields That May Legitimately Remain NULL

These fields are intentionally left NULL when OSM doesn't provide them.
**We never fabricate data.**

| Field | Reason for sparse/null |
|---|---|
| `phone` | Only 25% of OSM POIs have phone numbers |
| `website` | Only 7% of OSM POIs have websites |
| `email` | Only 1% of OSM POIs have emails |
| `hours_json` | Only 5% of OSM POIs have opening_hours |
| `description` | Only ~0.4% of OSM POIs have descriptions |
| `accessibility` | Only 2% of OSM POIs have wheelchair tags |
| `addr_postcode` | Only 6% of OSM POIs in Ankara have postcodes |
| `description_tr` | No automated Turkish description available |
| `instagram` | Not an OSM tag |
| `avg_rating` | Requires user reviews |
| Photos | Requires photo upload workflow |

---

## District Enrichment

### Method

Districts are assigned via **PostGIS spatial containment** — not from `addr:district` OSM tags.

```sql
UPDATE locations l
SET district = d.name
FROM ankara_districts d
WHERE ST_Within(l.geom, d.geom)
AND l.source = 'osm';
```

This correctly assigns a district to **all 6,563 POIs** (100% coverage), even when the original OSM
record has no `addr:district` tag.

### District Polygon Source

- **Source:** OpenStreetMap relations, admin_level=6, boundary=administrative
- **Province:** Ankara (admin_level=4, OSM relation 223371)
- **Download:** Overpass API query for all admin_level=6 relations within Ankara province
- **License:** ODbL
- **Processing:** Way segments stitched using linearMerge algorithm → ST_MakeValid() → PostGIS MultiPolygon

### Ankara's 25 Districts (ilçeler)

Akyurt, Altındağ, Ayaş, Balâ, Beypazarı, Çamlıdere, Çankaya, Çubuk, Elmadağ, Etimesgut,
Evren, Gölbaşı, Güdül, Haymana, Kahramankazan, Kalecik, Keçiören, Kızılcahamam, Mamak,
Nallıhan, Polatlı, Pursaklar, Sincan, Şereflikoçhisar, Yenimahalle

---

## Data Quality Summary (v2 Import)

| Field | Count | % |
|---|---|---|
| Total POIs | 6,563 | 100% |
| category_id | 6,563 | **100%** |
| district (spatial join) | 6,563 | **100%** |
| address | 2,192 | 33% |
| phone | 1,619 | 25% |
| subcategory | 4,515 | 69% |
| operator | 1,162 | 18% |
| website | 470 | 7% |
| addr_postcode | 426 | 6% |
| opening_hours | 305 | 5% |
| email | 72 | 1% |
| accessibility | 123 | 2% |
| description | 27 | <1% |

---

## Re-Import Procedure

To reproduce the full import from scratch:

### Prerequisites
- Docker running: `docker compose up -d`
- pg module available: `npm install pg --prefix scripts/`

### Step 1: Copy pg modules into container

```bash
# Run once after container recreation
node -e "
const {execSync} = require('child_process');
['pg','pg-pool','pg-types','pg-cloudflare','pg-connection-string','pg-int8',
 'pg-protocol','pgpass','postgres-array','postgres-bytea','postgres-date',
 'postgres-interval','split2','xtend'].forEach(m =>
  execSync('docker cp scripts/node_modules/' + m + ' ankara_gis_api:/tmp/' + m)
);
execSync('docker exec -u root ankara_gis_api sh -c \"mkdir -p /tmp/node_modules && cp -r /tmp/pg /tmp/pg-pool /tmp/pg-types /tmp/pg-cloudflare /tmp/pg-connection-string /tmp/pg-int8 /tmp/pg-protocol /tmp/pgpass /tmp/postgres-array /tmp/postgres-bytea /tmp/postgres-date /tmp/postgres-interval /tmp/split2 /tmp/xtend /tmp/node_modules/\"');
"
```

### Step 2: Safe cleanup (preserves manual records)

```bash
docker exec ankara_gis_db psql -U postgres -d ankara_gis -c "DELETE FROM locations WHERE source = 'osm';"
```

### Step 3: Run improved importer

```bash
docker cp scripts/import_container.mjs ankara_gis_api:/tmp/scripts/import_container.mjs
docker exec -u root ankara_gis_api chmod 777 /tmp/scripts/import_container.mjs
docker exec ankara_gis_api node /tmp/scripts/import_container.mjs
```

### Step 4: Run district spatial enrichment

```bash
docker cp scripts/enrich_districts.mjs ankara_gis_api:/tmp/scripts/enrich_districts.mjs
docker exec -u root ankara_gis_api chmod 777 /tmp/scripts/enrich_districts.mjs
docker exec ankara_gis_api node /tmp/scripts/enrich_districts.mjs
```

### Step 5: Verify

```bash
docker exec ankara_gis_db psql -U postgres -d ankara_gis -c "
SELECT COUNT(*) total, COUNT(district) with_district, COUNT(address) with_address,
       COUNT(phone) with_phone FROM locations WHERE source='osm';"
```

### Step 6: Rebuild Docker images with schema changes

```bash
docker compose build --no-cache api web
docker compose up -d api web
```

---

## Schema Changes (v2)

Added to `locations` table:

| Column | Type | Description |
|---|---|---|
| `addr_postcode` | `text` | OSM `addr:postcode` value |
| `operator` | `text` | OSM `operator` or `brand` |

Added table `ankara_districts`:

```sql
CREATE TABLE ankara_districts (
  id      SERIAL PRIMARY KEY,
  name    text NOT NULL,
  name_tr text,
  osm_id  bigint,
  geom    geometry(MultiPolygon, 4326)
);
CREATE INDEX ankara_districts_geom_gist ON ankara_districts USING GIST(geom);
```

---

## Overpass Query Design

The importer uses a single Overpass query with all category tags combined:

```
[out:json][timeout:180];
(
  node["amenity"="hospital"](39.5,32.3,40.2,33.1);
  way["amenity"="hospital"](39.5,32.3,40.2,33.1);
  node["amenity"="school"](39.5,32.3,40.2,33.1);
  way["amenity"="school"](39.5,32.3,40.2,33.1);
  ... (all category tags)
);
out center tags;
```

`out center tags` returns:
- For **nodes**: exact GPS coordinates + all tags
- For **ways** (building polygons): centroid coordinates + all tags

Ways carry much richer metadata (addresses, postcodes, operator, etc.) than nodes.

---

## Attribution Requirements

Any public deployment of AnchorMap must display:

> Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL

This applies to the map tiles and to the POI data imported from OSM.
