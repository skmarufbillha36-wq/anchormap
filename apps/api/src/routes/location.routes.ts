import { Router } from 'express';
import { locationController } from '../controllers/location.controller';
import { reviewController } from '../controllers/review.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { locationQuerySchema, nearbyQuerySchema, createReviewSchema } from '../validations/schemas';
import { prisma } from '@ankara-gis/database';
import { ApiResponseBuilder } from '../utils/errors';
import rateLimit from 'express-rate-limit';

const router = Router();

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many reviews submitted. Try again later.' },
});

// ─── Public Location Endpoints ────────────────────────────────

/** GET /api/v1/locations — bbox query for map */
router.get('/', validate(locationQuerySchema, 'query'), locationController.list);

/** GET /api/v1/locations/:slug — full detail */
router.get('/:slug', optionalAuth, locationController.getOne);

/** GET /api/v1/locations/:id/nearby */
router.get('/:id/nearby', validate(nearbyQuerySchema, 'query'), locationController.nearby);

/** GET /api/v1/locations/:id/reviews */
router.get('/:id/reviews', reviewController.list);

/** POST /api/v1/locations/:id/reviews */
router.post(
  '/:id/reviews',
  authenticate,
  reviewLimiter,
  validate(createReviewSchema),
  reviewController.upsert
);

/** DELETE /api/v1/reviews/:id — delete own review */
// Note: mounted separately in app.ts under /api/v1/reviews

/** POST /api/v1/reviews/:id/flag */
// Note: mounted separately

// ─── Favorites ────────────────────────────────────────────────

/** GET /api/v1/favorites */
router.get('/favorites/list', authenticate, async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(ApiResponseBuilder.success('Favorites fetched.', favorites));
});

/** POST /api/v1/locations/:locationId/favorite */
router.post('/:locationId/favorite', authenticate, async (req, res) => {
  await prisma.favorite.upsert({
    where: { userId_locationId: { userId: req.user!.userId, locationId: String(req.params.locationId) } },
    create: { userId: req.user!.userId, locationId: String(req.params.locationId) },
    update: {},
  });
  res.json(ApiResponseBuilder.success('Added to favorites.'));
});

/** DELETE /api/v1/locations/:locationId/favorite */
router.delete('/:locationId/favorite', authenticate, async (req, res) => {
  await prisma.favorite.deleteMany({
    where: { userId: req.user!.userId, locationId: String(req.params.locationId) },
  });
  res.json(ApiResponseBuilder.success('Removed from favorites.'));
});

export default router;
