import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/errors';
import { prisma } from '@ankara-gis/database';

// Extend Express Request to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

/**
 * authenticate — verifies the JWT in the Authorization header.
 * Attaches req.user = { userId, role } on success.
 * Throws 401 if token is missing, invalid, or expired.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  // Verify user still exists (handles deleted accounts)
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new ApiError(401, 'User not found. Please log in again.');
  }

  req.user = { userId: user.id, role: user.role };
  next();
}

/**
 * requireAdmin — must be used AFTER authenticate.
 * Throws 403 if the authenticated user is not an ADMIN.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required.');
  }
  if (req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Admin access required.');
  }
  next();
}

/**
 * optionalAuth — attaches req.user if a valid token is present,
 * but does NOT throw if no token is provided. Useful for endpoints
 * that behave differently for authenticated vs anonymous users
 * (e.g., showing whether a location is favorited).
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });
    if (user) {
      req.user = { userId: user.id, role: user.role };
    }
  } catch {
    // Invalid token — treat as anonymous, don't throw
  }
  next();
}
