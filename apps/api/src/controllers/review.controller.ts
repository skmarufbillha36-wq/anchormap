import { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { ApiResponseBuilder } from '../utils/errors';

export const reviewController = {
  async list(req: Request, res: Response) {
    const reviews = await reviewService.getForLocation(String(req.params.id));
    res.json(ApiResponseBuilder.success('Reviews fetched.', reviews));
  },

  async upsert(req: Request, res: Response) {
    const review = await reviewService.upsert(String(req.params.id), req.user!.userId, req.body);
    res.status(201).json(ApiResponseBuilder.success('Review saved.', review));
  },

  async delete(req: Request, res: Response) {
    await reviewService.delete(String(req.params.id), req.user!.userId);
    res.json(ApiResponseBuilder.success('Review deleted.'));
  },

  async flag(req: Request, res: Response) {
    await reviewService.flag(String(req.params.id));
    res.json(ApiResponseBuilder.success('Review flagged.'));
  },
};

export const adminReviewController = {
  async list(req: Request, res: Response) {
    const { reviews, pagination } = await reviewService.adminList(req.query);
    res.json(ApiResponseBuilder.success('Reviews fetched.', reviews, pagination));
  },

  async hide(req: Request, res: Response) {
    await reviewService.hide(String(req.params.id));
    res.json(ApiResponseBuilder.success('Review hidden.'));
  },

  async delete(req: Request, res: Response) {
    const { prisma } = await import('@ankara-gis/database');
    const review = await prisma.review.findUnique({ where: { id: String(req.params.id) } });
    if (!review) { res.status(404).json(ApiResponseBuilder.error('Review not found.')); return; }
    await prisma.review.delete({ where: { id: String(req.params.id) } });
    res.json(ApiResponseBuilder.success('Review deleted.'));
  },
};
