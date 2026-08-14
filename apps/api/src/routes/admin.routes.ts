import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createLocationSchema, updateLocationSchema, paginationSchema } from '../validations/schemas';
import { adminLocationController } from '../controllers/location.controller';
import { adminReviewController } from '../controllers/review.controller';
import { prisma } from '@ankara-gis/database';
import { ApiResponseBuilder } from '../utils/errors';
import { paginate, parsePagination } from '../utils/helpers';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─── Locations ────────────────────────────────────────────────
router.get('/locations', adminLocationController.list);
router.get('/locations/:id', adminLocationController.getOne);
router.post('/locations', validate(createLocationSchema), adminLocationController.create);
router.post('/locations/bulk-approve', adminLocationController.bulkApprove);
router.patch('/locations/:id', validate(updateLocationSchema), adminLocationController.update);
router.delete('/locations/:id', adminLocationController.softDelete);
router.post('/locations/:id/approve', adminLocationController.approve);
router.post('/locations/:id/reject', adminLocationController.reject);

// ─── Categories ───────────────────────────────────────────────
router.get('/categories', async (_req, res) => {
  // Return parent-with-children nested structure + location counts,
  // matching what the categories admin page expects.
  const cats = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { locations: true } } },
      },
      _count: { select: { locations: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  res.json(ApiResponseBuilder.success('Categories fetched.', cats));
});

router.post('/categories', async (req, res) => {
  const cat = await prisma.category.create({ data: req.body });
  res.status(201).json(ApiResponseBuilder.success('Category created.', cat));
});

router.patch('/categories/:id', async (req, res) => {
  const cat = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  res.json(ApiResponseBuilder.success('Category updated.', cat));
});

router.delete('/categories/:id', async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json(ApiResponseBuilder.success('Category deleted.'));
});

// ─── Reviews ──────────────────────────────────────────────────
router.get('/reviews', adminReviewController.list);
router.patch('/reviews/:id/hide', adminReviewController.hide);
router.delete('/reviews/:id', adminReviewController.delete);

// ─── Reports ──────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query as any);
  const where: any = {};
  if ((req.query as any).status) where.status = (req.query as any).status;

  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      include: { location: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
  ]);
  res.json(ApiResponseBuilder.success('Reports fetched.', reports, paginate(total, page, limit)));
});

router.patch('/reports/:id', async (req, res) => {
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { status: req.body.status, resolvedBy: req.user!.userId, resolvedAt: new Date() },
  });
  res.json(ApiResponseBuilder.success('Report updated.', report));
});

// ─── Suggestions ──────────────────────────────────────────────
router.get('/suggestions', async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query as any);
  const where: any = {};
  if ((req.query as any).status) where.status = (req.query as any).status;

  const [total, suggestions] = await Promise.all([
    prisma.suggestion.count({ where }),
    prisma.suggestion.findMany({
      where,
      include: { suggester: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
  ]);
  res.json(ApiResponseBuilder.success('Suggestions fetched.', suggestions, paginate(total, page, limit)));
});

router.post('/suggestions/:id/approve', async (req, res) => {
  await prisma.suggestion.update({
    where: { id: req.params.id },
    data: { status: 'approved', reviewedBy: req.user!.userId, reviewedAt: new Date() },
  });
  res.json(ApiResponseBuilder.success('Suggestion approved.'));
});

router.post('/suggestions/:id/reject', async (req, res) => {
  await prisma.suggestion.update({
    where: { id: req.params.id },
    data: { status: 'rejected', reviewedBy: req.user!.userId, reviewedAt: new Date() },
  });
  res.json(ApiResponseBuilder.success('Suggestion rejected.'));
});

// ─── Users ────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query as any);
  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, provider: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
  ]);
  res.json(ApiResponseBuilder.success('Users fetched.', users, paginate(total, page, limit)));
});

router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body as { role: string };
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  res.json(ApiResponseBuilder.success('User role updated.', { id: user.id, role: user.role }));
});

// ─── Audit Log ────────────────────────────────────────────────
router.get('/audit-log', async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query as any);
  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
  ]);
  res.json(ApiResponseBuilder.success('Audit log fetched.', logs, paginate(total, page, limit)));
});

// ─── Dashboard Stats ──────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  const [totalLocations, pending, approved, totalUsers, totalReviews, openReports] =
    await Promise.all([
      prisma.location.count({ where: { status: { not: 'deleted' } } }),
      prisma.location.count({ where: { status: 'pending' } }),
      prisma.location.count({ where: { status: 'approved' } }),
      prisma.user.count(),
      prisma.review.count({ where: { status: 'published' } }),
      prisma.report.count({ where: { status: 'open' } }),
    ]);

  res.json(ApiResponseBuilder.success('Stats fetched.', {
    totalLocations, pending, approved, totalUsers, totalReviews, openReports,
  }));
});

export default router;
