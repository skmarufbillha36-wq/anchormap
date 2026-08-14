import { Router } from 'express';
import { prisma } from '@ankara-gis/database';
import { ApiResponseBuilder } from '../utils/errors';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createReportSchema, createSuggestionSchema } from '../validations/schemas';

const router = Router();

// ─── Categories (public) ─────────────────────────────────────

router.get('/categories', async (_req, res) => {
  const cats = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { name: 'asc' } } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  res.json(ApiResponseBuilder.success('Categories fetched.', cats));
});

router.get('/categories/:slug', async (req, res) => {
  const cat = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { children: true },
  });
  if (!cat) { res.status(404).json(ApiResponseBuilder.error('Category not found.')); return; }
  res.json(ApiResponseBuilder.success('Category fetched.', cat));
});

// ─── Search (public) ──────────────────────────────────────────

router.get('/search', async (req, res) => {
  const { q, categoryId } = req.query as { q?: string; categoryId?: string };
  if (!q || q.trim().length < 2) {
    res.status(400).json(ApiResponseBuilder.error('Query must be at least 2 characters.'));
    return;
  }
  const { locationService } = await import('../services/location.service');
  const results = await locationService.search(q.trim(), categoryId);
  res.json(ApiResponseBuilder.success(`${results.length} results found.`, results));
});

// ─── Reports (authenticated) ──────────────────────────────────

router.post('/reports', authenticate, validate(createReportSchema), async (req, res) => {
  const report = await prisma.report.create({
    data: {
      locationId: req.body.locationId,
      reporterId: req.user!.userId,
      type: req.body.type,
      description: req.body.description ?? null,
    },
  });
  res.status(201).json(ApiResponseBuilder.success('Report submitted. Thank you.', { id: report.id }));
});

// ─── Suggestions (authenticated) ─────────────────────────────

router.post('/suggestions', authenticate, validate(createSuggestionSchema), async (req, res) => {
  const suggestion = await prisma.suggestion.create({
    data: {
      suggestedBy: req.user!.userId,
      name: req.body.name,
      nameTr: req.body.nameTr ?? null,
      categoryId: req.body.categoryId ?? null,
      lat: req.body.lat,
      lng: req.body.lng,
      address: req.body.address ?? null,
      description: req.body.description ?? null,
    },
  });
  res.status(201).json(ApiResponseBuilder.success('Suggestion submitted. Thank you!', { id: suggestion.id }));
});

// ─── Reviews (delete/flag — separate paths) ───────────────────

router.delete('/reviews/:id', authenticate, async (req, res) => {
  const { reviewService } = await import('../services/review.service');
  await reviewService.delete(String(req.params.id), req.user!.userId);
  res.json(ApiResponseBuilder.success('Review deleted.'));
});

router.post('/reviews/:id/flag', authenticate, async (req, res) => {
  const { reviewService } = await import('../services/review.service');
  await reviewService.flag(String(req.params.id));
  res.json(ApiResponseBuilder.success('Review flagged.'));
});

// ─── Favorites ────────────────────────────────────────────────

router.get('/favorites', authenticate, async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.userId },
    include: { location: { select: { id: true, slug: true, name: true, nameTr: true, district: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(ApiResponseBuilder.success('Favorites fetched.', favorites));
});

// ─── Health ───────────────────────────────────────────────────

router.get('/health', (_req, res) => {
  res.json(ApiResponseBuilder.success('API is healthy.', {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }));
});

export default router;
