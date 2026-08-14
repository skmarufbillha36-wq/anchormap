import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { cloudinary } from '../config/cloudinary';
import { prisma } from '@ankara-gis/database';
import { ApiResponseBuilder, ApiError } from '../utils/errors';

const router = Router();

router.post(
  '/locations/:locationId/photos',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { dataUri, caption, captionTr, isPrimary } = req.body as {
      dataUri: string;
      caption?: string;
      captionTr?: string;
      isPrimary?: boolean;
    };

    if (!dataUri?.startsWith('data:image/')) {
      throw new ApiError(400, 'Invalid image data. Expected a base64 data URI.');
    }

    const locationId = String(req.params.locationId);
    const location = await prisma.location.findUnique({ where: { id: locationId }, select: { id: true } });
    if (!location) throw new ApiError(404, 'Location not found.');

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'ankara-gis/locations',
      resource_type: 'image',
      quality: 'auto:good',
      fetch_format: 'auto',
      width: 1200,
      crop: 'limit',
    });

    if (isPrimary) {
      await prisma.photo.updateMany({
        where: { locationId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const photo = await prisma.photo.create({
      data: {
        locationId,
        url: result.secure_url,
        publicId: result.public_id,
        caption: caption ?? null,
        captionTr: captionTr ?? null,
        isPrimary: isPrimary ?? false,
        uploadedBy: req.user!.userId,
      },
    });

    res.status(201).json(ApiResponseBuilder.success('Photo uploaded.', photo));
  }
);

router.delete(
  '/photos/:photoId',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    const photoId = String(req.params.photoId);
    const photo = await prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) throw new ApiError(404, 'Photo not found.');

    await cloudinary.uploader.destroy(photo.publicId);
    await prisma.photo.delete({ where: { id: photoId } });

    res.json(ApiResponseBuilder.success('Photo deleted.'));
  }
);

export default router;
