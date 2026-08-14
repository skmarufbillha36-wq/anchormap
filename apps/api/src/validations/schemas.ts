import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address.'),
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address.'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const locationQuerySchema = z.object({
  minLat: z.coerce.number().optional(),
  maxLat: z.coerce.number().optional(),
  minLng: z.coerce.number().optional(),
  maxLng: z.coerce.number().optional(),
  categoryId: z.string().uuid().optional(),
  district: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'deleted']).optional(),
  source: z.enum(['osm', 'manual', 'user_suggestion']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(39.0).max(41.0, 'Latitude out of Ankara range.'),
  lng: z.coerce.number().min(31.5).max(34.0, 'Longitude out of Ankara range.'),
  radius: z.coerce.number().int().min(100).max(50000).default(1000),
  categoryId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createLocationSchema = z.object({
  name: z.string().min(2).max(200),
  nameTr: z.string().max(200).optional(),
  categoryId: z.string().uuid(),
  subcategory: z.string().optional(),
  lat: z.number().min(39.0).max(41.0, 'Latitude must be within Ankara region.'),
  lng: z.number().min(31.5).max(34.0, 'Longitude must be within Ankara region.'),
  district: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  descriptionTr: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  instagram: z.string().optional(),
  hoursJson: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).default([]),
  accessibility: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('approved'),
});

export const updateLocationSchema = createLocationSchema.partial();

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().max(2000).optional(),
});

export const createReportSchema = z.object({
  locationId: z.string().uuid(),
  type: z.enum([
    'wrong_location',
    'wrong_info',
    'permanently_closed',
    'duplicate',
    'inappropriate',
    'other',
  ]),
  description: z.string().max(1000).optional(),
});

export const createSuggestionSchema = z.object({
  name: z.string().min(2).max(200),
  nameTr: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  lat: z.number().min(39.0).max(41.0),
  lng: z.number().min(31.5).max(34.0),
  address: z.string().optional(),
  description: z.string().max(2000).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  status: z.string().optional(),
});
