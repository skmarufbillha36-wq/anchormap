import bcrypt from 'bcryptjs';
import { prisma } from '@ankara-gis/database';
import { ApiError } from '../utils/errors';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../utils/jwt';
import { User } from '@ankara-gis/types';

// ─── Helper ───────────────────────────────────────────────────

function mapUser(u: {
  id: string; email: string; name: string; avatarUrl: string | null;
  role: string; provider: string; emailVerified: boolean;
  createdAt: Date; updatedAt: Date;
}): User {
  return {
    id: u.id, email: u.email, name: u.name, avatarUrl: u.avatarUrl,
    role: u.role as User['role'], provider: u.provider as User['provider'],
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString(),
  };
}

// ─── Service ──────────────────────────────────────────────────

export const authService = {
  /** Register a new user with email + password */
  async register(data: { email: string; name: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ApiError(409, 'An account with this email already exists.');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        passwordHash,
        role: 'USER',
        provider: 'email',
        emailVerified: false,
      },
    });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id);
    return { user: mapUser(user), accessToken, refreshToken };
  },

  /** Login with email + password */
  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });

    if (!user || !user.passwordHash) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new ApiError(401, 'Invalid email or password.');

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id);
    return { user: mapUser(user), accessToken, refreshToken };
  },

  /** Upsert a Google OAuth user */
  async loginWithGoogle(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    let user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.avatarUrl ?? null,
          provider: 'google',
          emailVerified: true,
          role: 'USER',
        },
      });
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id);
    return { user: mapUser(user), accessToken, refreshToken };
  },

  /** Refresh access token using refresh token */
  async refresh(refreshToken: string) {
    let payload: { userId: string };
    try {
      payload = verifyToken(refreshToken) as { userId: string };
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token. Please log in again.');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) throw new ApiError(401, 'User not found.');

    const newAccessToken = signAccessToken({ userId: user.id, role: user.role });
    return { accessToken: newAccessToken, user: mapUser(user) };
  },

  /** Get current user by ID */
  async getMe(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found.');
    return mapUser(user);
  },
};
