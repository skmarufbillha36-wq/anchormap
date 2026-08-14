import { Request, Response } from 'express';
import { locationService } from '../services/location.service';
import { ApiResponseBuilder } from '../utils/errors';

export const locationController = {
  /** GET /api/v1/locations — bbox/filter query */
  async list(req: Request, res: Response) {
    const locations = await locationService.getByBbox(req.query as any);
    res.json(ApiResponseBuilder.success('Locations fetched.', locations));
  },

  /** GET /api/v1/search?q= */
  async search(req: Request, res: Response) {
    const q = String(req.query.q ?? '');
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
    const results = await locationService.search(q, categoryId);
    res.json(ApiResponseBuilder.success('Search results.', results));
  },

  /** GET /api/v1/locations/:slug */
  async getOne(req: Request, res: Response) {
    const slug = String(req.params.slug);
    const location = await locationService.getBySlug(slug, req.user?.userId);
    res.json(ApiResponseBuilder.success('Location fetched.', location));
  },

  /** GET /api/v1/locations/:id/nearby */
  async nearby(req: Request, res: Response) {
    const results = await locationService.getNearby(req.query as any);
    res.json(ApiResponseBuilder.success('Nearby locations fetched.', results));
  },
};

export const adminLocationController = {
  /** GET /api/v1/admin/locations */
  async list(req: Request, res: Response) {
    const { locations, pagination } = await locationService.adminList(req.query as any);
    res.json(ApiResponseBuilder.success('Locations fetched.', locations, pagination));
  },

  /** GET /api/v1/admin/locations/:id — full location for edit form */
  async getOne(req: Request, res: Response) {
    const location = await locationService.getById(String(req.params.id));
    res.json(ApiResponseBuilder.success('Location fetched.', location));
  },

  /** POST /api/v1/admin/locations */
  async create(req: Request, res: Response) {
    const result = await locationService.create(req.body, req.user!.userId);
    res.status(201).json(ApiResponseBuilder.success('Location created.', result));
  },

  /** PATCH /api/v1/admin/locations/:id */
  async update(req: Request, res: Response) {
    const result = await locationService.update(String(req.params.id), req.body);
    res.json(ApiResponseBuilder.success('Location updated.', result));
  },

  /** DELETE /api/v1/admin/locations/:id */
  async softDelete(req: Request, res: Response) {
    await locationService.softDelete(String(req.params.id));
    res.json(ApiResponseBuilder.success('Location deleted.'));
  },

  /** POST /api/v1/admin/locations/:id/approve */
  async approve(req: Request, res: Response) {
    await locationService.approve(String(req.params.id));
    res.json(ApiResponseBuilder.success('Location approved.'));
  },

  /** POST /api/v1/admin/locations/:id/reject */
  async reject(req: Request, res: Response) {
    await locationService.reject(String(req.params.id));
    res.json(ApiResponseBuilder.success('Location rejected.'));
  },

  /** POST /api/v1/admin/locations/bulk-approve */
  async bulkApprove(req: Request, res: Response) {
    const { ids } = req.body as { ids: string[] };
    const result = await locationService.bulkApprove(ids);
    res.json(ApiResponseBuilder.success(`${result.approved} locations approved.`, result));
  },
};
