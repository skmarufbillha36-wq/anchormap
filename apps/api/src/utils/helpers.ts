import slugify from 'slugify';
import { prisma } from '@ankara-gis/database';

/**
 * Generates a unique URL-safe slug from a name.
 * If a collision exists, appends a counter: "ataturk-park-2", "ataturk-park-3", etc.
 */
export async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name, {
    lower: true,
    strict: true,    // removes special chars including Turkish letters
    trim: true,
  });

  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.location.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    if (!existing) return slug;

    counter++;
    slug = `${base}-${counter}`;
  }
}

/**
 * Validates that coordinates fall within the Ankara bounding box.
 */
export function isWithinAnkara(lat: number, lng: number): boolean {
  return lat >= 39.0 && lat <= 41.0 && lng >= 31.5 && lng <= 34.0;
}

/**
 * Formats pagination metadata for API responses.
 */
export function paginate(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Parses and sanitises pagination query parameters.
 */
export function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
