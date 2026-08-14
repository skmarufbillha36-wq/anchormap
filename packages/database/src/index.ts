import { PrismaClient } from '@prisma/client';

// Singleton pattern — prevents multiple Prisma clients in development
// (hot reload would otherwise create a new client on every file change)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export { PrismaClient };
export * from '@prisma/client';
