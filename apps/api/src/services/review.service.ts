import { prisma } from '@ankara-gis/database';
import { ApiError } from '../utils/errors';
import { locationRepository } from '../repositories/location.repository';
import { paginate, parsePagination } from '../utils/helpers';

export const reviewService = {
  /** Get published reviews for a location */
  async getForLocation(locationId: string) {
    const location = await prisma.location.findUnique({ where: { id: locationId }, select: { id: true } });
    if (!location) throw new ApiError(404, 'Location not found.');

    return prisma.review.findMany({
      where: { locationId, status: 'published' },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  /** Create or update a review (one per user per location) */
  async upsert(locationId: string, userId: string, data: { rating: number; content?: string }) {
    const location = await prisma.location.findUnique({
      where: { id: locationId, status: 'approved' },
      select: { id: true },
    });
    if (!location) throw new ApiError(404, 'Location not found.');

    const review = await prisma.review.upsert({
      where: { locationId_userId: { locationId, userId } },
      create: { locationId, userId, rating: data.rating, content: data.content ?? null },
      update: { rating: data.rating, content: data.content ?? null, updatedAt: new Date() },
    });

    await locationRepository.refreshRatingStats(locationId);
    return review;
  },

  /** Delete own review */
  async delete(reviewId: string, userId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new ApiError(404, 'Review not found.');
    if (review.userId !== userId) throw new ApiError(403, 'You can only delete your own reviews.');

    await prisma.review.delete({ where: { id: reviewId } });
    await locationRepository.refreshRatingStats(review.locationId);
  },

  /** Flag a review as inappropriate */
  async flag(reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new ApiError(404, 'Review not found.');

    return prisma.review.update({
      where: { id: reviewId },
      data: { flagCount: { increment: 1 } },
    });
  },

  /** Admin — paginated list of all reviews */
  async adminList(query: any) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.status) where.status = query.status;

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          location: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
    ]);

    return { reviews, pagination: paginate(total, page, limit) };
  },

  /** Admin — hide a review */
  async hide(reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new ApiError(404, 'Review not found.');
    const updated = await prisma.review.update({ where: { id: reviewId }, data: { status: 'hidden' } });
    await locationRepository.refreshRatingStats(review.locationId);
    return updated;
  },
};
