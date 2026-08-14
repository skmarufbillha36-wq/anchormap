import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * Signs a JWT access token with userId and role.
 * Expires in JWT_EXPIRES_IN (default 24h).
 */
export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Signs a JWT refresh token with userId only.
 * Expires in JWT_REFRESH_EXPIRES_IN (default 7d).
 */
export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token: string): TokenPayload & jwt.JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload & jwt.JwtPayload;
}

/** Cookie name for the refresh token */
export const REFRESH_COOKIE_NAME = 'refresh_token';

/** Cookie options for the refresh token — HttpOnly, Secure in production */
export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};
