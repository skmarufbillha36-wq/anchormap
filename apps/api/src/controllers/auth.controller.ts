import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponseBuilder } from '../utils/errors';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '../utils/jwt';

export const authController = {
  /** POST /api/v1/auth/register */
  async register(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
    res.status(201).json(ApiResponseBuilder.success('Account created successfully.', { user, accessToken }));
  },

  /** POST /api/v1/auth/login */
  async login(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
    res.json(ApiResponseBuilder.success('Login successful.', { user, accessToken }));
  },

  /** POST /api/v1/auth/logout */
  async logout(_req: Request, res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME);
    res.json(ApiResponseBuilder.success('Logged out successfully.'));
  },

  /** GET /api/v1/auth/me */
  async me(req: Request, res: Response) {
    const user = await authService.getMe(req.user!.userId);
    res.json(ApiResponseBuilder.success('User profile fetched.', user));
  },

  /** POST /api/v1/auth/refresh */
  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      res.status(401).json(ApiResponseBuilder.error('No refresh token provided.'));
      return;
    }
    const { accessToken, user } = await authService.refresh(refreshToken);
    res.json(ApiResponseBuilder.success('Token refreshed.', { accessToken, user }));
  },
};
