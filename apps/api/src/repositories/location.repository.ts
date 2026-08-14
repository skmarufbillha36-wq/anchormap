import { prisma } from '@ankara-gis/database';
import { Prisma } from '@prisma/client';
import { LocationSummary, LocationNearby, Location } from '@ankara-gis/types';

// ─── Raw SQL Result Types ─────────────────────────────────────

interface RawLocationRow {
  id: string;
  slug: string;
  name: string;
  name_tr: string | null;
  category_id: string;
  lat: string;
  lng: string;
  district: string | null;
  avg_rating: string | null;
  review_count: string;
  primary_photo_url: string | null;
}

interface RawNearbyRow extends RawLocationRow {
  distance_m: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function mapRawToSummary(row: RawLocationRow): LocationSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameTr: row.name_tr,
    categoryId: row.category_id,
    lat: parseFloat(row.lat),
    lng: parseFloat(row.lng),
    district: row.district,
    avgRating: row.avg_rating ? parseFloat(row.avg_rating) : null,
    reviewCount: parseInt(row.review_count, 10),
    primaryPhotoUrl: row.primary_photo_url,
  };
}

// ─── Repository ───────────────────────────────────────────────

export const locationRepository = {
  /**
   * Fetches locations within a map viewport bounding box.
   * Uses PostGIS && operator with GIST index for fast spatial filtering.
   */
  async findByBbox(params: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
    categoryId?: string;
    categoryIds?: string[];   // expanded from parent category
    district?: string;
    status?: string;
    limit?: number;
  }): Promise<LocationSummary[]> {
    const { minLng, minLat, maxLng, maxLat, categoryId, categoryIds, district, limit = 200 } = params;
    const status = params.status ?? 'approved';

    // Pre-build optional filter fragments — required pattern for Prisma tagged templates
    const catFilter: Prisma.Sql = categoryIds?.length
      ? Prisma.sql`AND l.category_id = ANY(${categoryIds}::uuid[])`
      : categoryId
        ? Prisma.sql`AND l.category_id = ${categoryId}::uuid`
        : Prisma.sql``;

    const distFilter: Prisma.Sql = district
      ? Prisma.sql`AND l.district = ${district}`
      : Prisma.sql``;

    const rows = await prisma.$queryRaw<RawLocationRow[]>(
      Prisma.sql`
        SELECT
          l.id, l.slug, l.name, l.name_tr, l.category_id, l.district,
          ST_Y(l.geom) AS lat,
          ST_X(l.geom) AS lng,
          l.avg_rating, l.review_count,
          p.url AS primary_photo_url
        FROM locations l
        LEFT JOIN photos p ON p.location_id = l.id AND p.is_primary = true
        WHERE l.status = ${status}
          AND l.geom && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
          ${catFilter}
          ${distFilter}
        LIMIT ${limit}
      `
    );

    return rows.map(mapRawToSummary);
  },

  /**
   * Finds locations within a radius of a coordinate.
   * Uses ST_DWithin with ::geography cast for accurate meter-based distance.
   * Returns results sorted by distance ascending.
   */
  async findNearby(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    categoryId?: string;
    limit?: number;
  }): Promise<LocationNearby[]> {
    const { lat, lng, radiusMeters, categoryId, limit = 20 } = params;

    const rows = await prisma.$queryRaw<RawNearbyRow[]>`
      SELECT
        l.id, l.slug, l.name, l.name_tr, l.category_id, l.district,
        ST_Y(l.geom) AS lat,
        ST_X(l.geom) AS lng,
        l.avg_rating, l.review_count,
        p.url AS primary_photo_url,
        ROUND(
          ST_Distance(
            l.geom::geography,
            ST_Point(${lng}, ${lat})::geography
          )::numeric, 0
        ) AS distance_m
      FROM locations l
      LEFT JOIN photos p ON p.location_id = l.id AND p.is_primary = true
      WHERE l.status = 'approved'
        AND ST_DWithin(
          l.geom::geography,
          ST_Point(${lng}, ${lat})::geography,
          ${radiusMeters}
        )
        AND (${categoryId ?? null}::uuid IS NULL OR l.category_id = ${categoryId ?? null}::uuid)
      ORDER BY distance_m ASC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      ...mapRawToSummary(row),
      distanceM: parseFloat(row.distance_m),
    }));
  },

  /**
   * Full-text + trigram search across English and Turkish names.
   */
  async search(params: {
    q: string;
    categoryId?: string;
    limit?: number;
  }): Promise<LocationSummary[]> {
    const { q, categoryId, limit = 50 } = params;

    const rows = await prisma.$queryRaw<RawLocationRow[]>`
      SELECT
        l.id, l.slug, l.name, l.name_tr, l.category_id, l.district,
        ST_Y(l.geom) AS lat,
        ST_X(l.geom) AS lng,
        l.avg_rating, l.review_count,
        p.url AS primary_photo_url
      FROM locations l
      LEFT JOIN photos p ON p.location_id = l.id AND p.is_primary = true
      WHERE l.status = 'approved'
        AND (
          l.name ILIKE ${'%' + q + '%'}
          OR l.name_tr ILIKE ${'%' + q + '%'}
          OR l.address ILIKE ${'%' + q + '%'}
        )
        AND (${categoryId ?? null}::uuid IS NULL OR l.category_id = ${categoryId ?? null}::uuid)
      ORDER BY
        CASE WHEN l.name ILIKE ${q + '%'} THEN 0 ELSE 1 END,
        l.name ASC
      LIMIT ${limit}
    `;

    return rows.map(mapRawToSummary);
  },

  /**
   * Inserts a location with PostGIS geometry from lat/lng.
   * Returns the created location ID.
   */
  async insertWithGeom(params: {
    id: string;
    slug: string;
    name: string;
    nameTr?: string;
    categoryId: string;
    subcategory?: string;
    lat: number;
    lng: number;
    district?: string;
    address?: string;
    description?: string;
    descriptionTr?: string;
    phone?: string;
    website?: string;
    email?: string;
    tags?: string[];
    status?: string;
    source?: string;
    osmId?: bigint;
    osmType?: string;
    createdBy?: string;
  }): Promise<{ id: string }> {
    const {
      id, slug, name, nameTr, categoryId, subcategory, lat, lng,
      district, address, description, descriptionTr, phone, website, email,
      tags = [], status = 'approved', source = 'manual', osmId, osmType, createdBy,
    } = params;

    await prisma.$executeRaw`
      INSERT INTO locations (
        id, slug, name, name_tr, category_id, subcategory,
        geom, district, address, description, description_tr,
        phone, website, email, tags, status, source, osm_id, osm_type, created_by, updated_at
      ) VALUES (
        ${id}::uuid, ${slug}, ${name}, ${nameTr ?? null}, ${categoryId}::uuid, ${subcategory ?? null},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${district ?? null}, ${address ?? null}, ${description ?? null}, ${descriptionTr ?? null},
        ${phone ?? null}, ${website ?? null}, ${email ?? null},
        ${tags}::text[], ${status}, ${source},
        ${osmId ?? null}, ${osmType ?? null}, ${createdBy ?? null}::uuid, NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `;

    return { id };
  },

  /**
   * Updates geom column when lat/lng changes on an existing location.
   */
  async updateGeom(id: string, lat: number, lng: number): Promise<void> {
    await prisma.$executeRaw`
      UPDATE locations
      SET geom = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          updated_at = NOW()
      WHERE id = ${id}::uuid
    `;
  },

  /**
   * Fetches a single location by UUID (for admin edit form).
   * Returns full detail including lat/lng and category.
   */
  async findById(id: string): Promise<(Location & { lat: number; lng: number }) | null> {
    interface FullRow {
      id: string; osm_id: string | null; osm_type: string | null; slug: string;
      name: string; name_tr: string | null; category_id: string; subcategory: string | null;
      lat: string; lng: string; district: string | null; address: string | null;
      description: string | null; description_tr: string | null;
      phone: string | null; website: string | null; email: string | null; instagram: string | null;
      operator: string | null; addr_postcode: string | null;
      hours_json: unknown; tags: string[]; accessibility: string | null;
      status: string; source: string; avg_rating: string | null; review_count: string;
      created_at: string; updated_at: string; created_by: string | null;
    }

    const rows = await prisma.$queryRaw<FullRow[]>`
      SELECT
        l.id, l.osm_id, l.osm_type, l.slug, l.name, l.name_tr,
        l.category_id, l.subcategory, l.district, l.address,
        l.description, l.description_tr, l.phone, l.website,
        l.email, l.instagram, l.operator, l.addr_postcode,
        l.hours_json, l.tags, l.accessibility, l.status, l.source,
        l.avg_rating, l.review_count, l.created_at, l.updated_at, l.created_by,
        ST_Y(l.geom) AS lat, ST_X(l.geom) AS lng
      FROM locations l
      WHERE l.id = ${id}::uuid
      LIMIT 1
    `;

    if (!rows.length) return null;
    const r = rows[0];

    const category = await prisma.category.findUnique({ where: { id: r.category_id } });
    const photos = await prisma.photo.findMany({
      where: { locationId: r.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return {
      id: r.id, osmId: r.osm_id ? parseInt(r.osm_id) : null, osmType: r.osm_type,
      slug: r.slug, name: r.name, nameTr: r.name_tr, categoryId: r.category_id,
      category: category ? {
        id: category.id, name: category.name, nameTr: category.nameTr,
        slug: category.slug, icon: category.icon, color: category.color,
        parentId: category.parentId, sortOrder: category.sortOrder,
      } : undefined,
      subcategory: r.subcategory,
      lat: parseFloat(r.lat), lng: parseFloat(r.lng),
      district: r.district, address: r.address,
      description: r.description, descriptionTr: r.description_tr,
      phone: r.phone, website: r.website, email: r.email, instagram: r.instagram,
      operator: r.operator, addrPostcode: r.addr_postcode,
      hoursJson: r.hours_json as any, tags: r.tags ?? [], accessibility: r.accessibility,
      status: r.status as any, source: r.source as any,
      avgRating: r.avg_rating ? parseFloat(r.avg_rating) : null,
      reviewCount: parseInt(r.review_count, 10),
      photos: photos.map((p) => ({
        id: p.id, locationId: p.locationId, url: p.url, publicId: p.publicId,
        caption: p.caption, captionTr: p.captionTr, isPrimary: p.isPrimary,
        uploadedBy: p.uploadedBy, createdAt: p.createdAt.toISOString(),
      })),
      createdAt: r.created_at, updatedAt: r.updated_at, createdBy: r.created_by,
    };
  },

  /**
   * Fetches full location detail including lat/lng extracted from geom.
   */
  async findBySlug(slug: string): Promise<(Location & { lat: number; lng: number }) | null> {
    interface FullRow {
      id: string; osm_id: string | null; osm_type: string | null; slug: string;
      name: string; name_tr: string | null; category_id: string; subcategory: string | null;
      lat: string; lng: string; district: string | null; address: string | null;
      description: string | null; description_tr: string | null;
      phone: string | null; website: string | null; email: string | null; instagram: string | null;
      operator: string | null; addr_postcode: string | null;
      hours_json: unknown; tags: string[]; accessibility: string | null;
      status: string; source: string; avg_rating: string | null; review_count: string;
      created_at: string; updated_at: string; created_by: string | null;
    }

    const rows = await prisma.$queryRaw<FullRow[]>`
      SELECT
        l.id, l.osm_id, l.osm_type, l.slug, l.name, l.name_tr,
        l.category_id, l.subcategory, l.district, l.address,
        l.description, l.description_tr, l.phone, l.website,
        l.email, l.instagram, l.operator, l.addr_postcode,
        l.hours_json, l.tags, l.accessibility, l.status, l.source,
        l.avg_rating, l.review_count, l.created_at, l.updated_at, l.created_by,
        ST_Y(l.geom) AS lat, ST_X(l.geom) AS lng
      FROM locations l
      WHERE l.slug = ${slug}
      LIMIT 1
    `;

    if (!rows.length) return null;
    const r = rows[0];

    // Fetch photos separately via Prisma
    const photos = await prisma.photo.findMany({
      where: { locationId: r.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    const category = await prisma.category.findUnique({ where: { id: r.category_id } });

    return {
      id: r.id,
      osmId: r.osm_id ? parseInt(r.osm_id) : null,
      osmType: r.osm_type,
      slug: r.slug,
      name: r.name,
      nameTr: r.name_tr,
      categoryId: r.category_id,
      category: category ? {
        id: category.id, name: category.name, nameTr: category.nameTr,
        slug: category.slug, icon: category.icon, color: category.color,
        parentId: category.parentId, sortOrder: category.sortOrder,
      } : undefined,
      subcategory: r.subcategory,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      district: r.district,
      address: r.address,
      description: r.description,
      descriptionTr: r.description_tr,
      phone: r.phone,
      website: r.website,
      email: r.email,
      instagram: r.instagram,
      hoursJson: r.hours_json as any,
      tags: r.tags ?? [],
      accessibility: r.accessibility,
      operator: r.operator,
      addrPostcode: r.addr_postcode,
      status: r.status as any,
      source: r.source as any,
      avgRating: r.avg_rating ? parseFloat(r.avg_rating) : null,
      reviewCount: parseInt(r.review_count, 10),
      photos: photos.map((p) => ({
        id: p.id, locationId: p.locationId, url: p.url, publicId: p.publicId,
        caption: p.caption, captionTr: p.captionTr, isPrimary: p.isPrimary,
        uploadedBy: p.uploadedBy, createdAt: p.createdAt.toISOString(),
      })),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      createdBy: r.created_by,
    };
  },

  /**
   * Updates avg_rating and review_count for a location after a review change.
   */
  async refreshRatingStats(locationId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE locations
      SET
        avg_rating = (
          SELECT AVG(rating)::numeric(3,2)
          FROM reviews
          WHERE location_id = ${locationId}::uuid AND status = 'published'
        ),
        review_count = (
          SELECT COUNT(*)
          FROM reviews
          WHERE location_id = ${locationId}::uuid AND status = 'published'
        ),
        updated_at = NOW()
      WHERE id = ${locationId}::uuid
    `;
  },
};
