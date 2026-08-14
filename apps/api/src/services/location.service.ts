import { prisma } from '@ankara-gis/database';
import { ApiError } from '../utils/errors';
import { locationRepository } from '../repositories/location.repository';
import { generateUniqueSlug, paginate, parsePagination } from '../utils/helpers';
import { LocationSummary, LocationFilters, NearbyFilters } from '@ankara-gis/types';
import { randomUUID } from 'crypto';

export const locationService = {
  /** Get locations within a map viewport bounding box.
   * If categoryId is a parent category, expands to all child category IDs.
   */
  async getByBbox(filters: LocationFilters) {
    const { minLat, maxLat, minLng, maxLng, categoryId, district } = filters;

    if (minLng === undefined || minLat === undefined || maxLng === undefined || maxLat === undefined) {
      throw new ApiError(400, 'Bounding box parameters (minLat, maxLat, minLng, maxLng) are required.');
    }

    // Resolve parent category → child category IDs for proper filtering
    let resolvedCategoryId = categoryId;
    let categoryIds: string[] | undefined;
    if (categoryId) {
      const children = await prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      if (children.length > 0) {
        // It's a parent — filter by all children
        categoryIds = children.map((c) => c.id);
        resolvedCategoryId = undefined;
      }
    }

    return locationRepository.findByBbox({
      minLng: Number(minLng),
      minLat: Number(minLat),
      maxLng: Number(maxLng),
      maxLat: Number(maxLat),
      categoryId: resolvedCategoryId,
      categoryIds,
      district,
      status: 'approved',
    });
  },

  /** Search locations by text query */
  async search(q: string, categoryId?: string) {
    if (!q || q.trim().length < 2) {
      throw new ApiError(400, 'Search query must be at least 2 characters.');
    }
    return locationRepository.search({ q: q.trim(), categoryId });
  },

  /** Get locations near a coordinate */
  async getNearby(filters: NearbyFilters) {
    const { lat, lng, radius = 1000, categoryId, limit = 20 } = filters;
    return locationRepository.findNearby({
      lat, lng, radiusMeters: Math.min(radius, 50000), categoryId, limit,
    });
  },

  /** Get single location by ID (for admin edit form) */
  async getById(id: string) {
    const location = await locationRepository.findById(id);
    if (!location) throw new ApiError(404, 'Location not found.');
    return location;
  },

  /** Get single location by slug OR uuid with full detail.
   * Accepts both slug strings and UUID strings so that links using
   * either /locations/my-slug or /locations/uuid-xxx both resolve correctly.
   */
  async getBySlug(slug: string, userId?: string) {
    // UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let location = UUID_RE.test(slug)
      ? await locationRepository.findById(slug)
      : await locationRepository.findBySlug(slug);
    if (!location) throw new ApiError(404, 'Location not found.');

    // Attach isFavorited if user is authenticated
    let isFavorited = false;
    if (userId) {
      const fav = await prisma.favorite.findUnique({
        where: { userId_locationId: { userId, locationId: location.id } },
        select: { userId: true },
      });
      isFavorited = !!fav;
    }

    return { ...location, isFavorited };
  },

  /** Admin — list all locations with pagination */
  async adminList(query: LocationFilters) {
    const { page, limit, skip } = parsePagination(query as any);
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.district) where.district = query.district;
    if (query.source) where.source = query.source;

    const [total, locations] = await Promise.all([
      prisma.location.count({ where }),
      prisma.location.findMany({
        where,
        select: {
          id: true, slug: true, name: true, nameTr: true, categoryId: true,
          district: true, status: true, source: true, avgRating: true,
          reviewCount: true, createdAt: true, updatedAt: true,
          category: { select: { name: true, slug: true, color: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { locations, pagination: paginate(total, page, limit) };
  },

  /** Admin — create a location */
  async create(data: any, createdBy: string) {
    const { lat, lng, ...rest } = data;
    const slug = await generateUniqueSlug(rest.name);
    const id = randomUUID();

    await locationRepository.insertWithGeom({
      id, slug, lat, lng, createdBy, ...rest,
    });

    return { id, slug };
  },

  /** Admin — update a location */
  async update(id: string, data: any) {
    const existing = await prisma.location.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new ApiError(404, 'Location not found.');

    const { lat, lng, ...rest } = data;

    // Update non-spatial fields via Prisma
    await prisma.location.update({
      where: { id },
      data: {
        ...rest,
        updatedAt: new Date(),
      },
    });

    // Update geometry if coordinates changed
    if (lat !== undefined && lng !== undefined) {
      await locationRepository.updateGeom(id, lat, lng);
    }

    return { id };
  },

  /** Admin — soft delete */
  async softDelete(id: string) {
    const existing = await prisma.location.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new ApiError(404, 'Location not found.');

    await prisma.location.update({
      where: { id },
      data: { status: 'deleted', updatedAt: new Date() },
    });
  },

  /** Admin — approve a pending location */
  async approve(id: string) {
    const loc = await prisma.location.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!loc) throw new ApiError(404, 'Location not found.');
    await prisma.location.update({ where: { id }, data: { status: 'approved', updatedAt: new Date() } });
  },

  /** Admin — reject a pending location */
  async reject(id: string) {
    const loc = await prisma.location.findUnique({ where: { id }, select: { id: true } });
    if (!loc) throw new ApiError(404, 'Location not found.');
    await prisma.location.update({ where: { id }, data: { status: 'rejected', updatedAt: new Date() } });
  },

  /** Admin — bulk approve */
  async bulkApprove(ids: string[]) {
    await prisma.location.updateMany({
      where: { id: { in: ids }, status: 'pending' },
      data: { status: 'approved', updatedAt: new Date() },
    });
    return { approved: ids.length };
  },
};
