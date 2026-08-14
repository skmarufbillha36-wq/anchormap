# ─── Stage 1: Install dependencies ───────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json ./
COPY packages/types/package.json       ./packages/types/
COPY packages/database/package.json    ./packages/database/
COPY apps/api/package.json             ./apps/api/

RUN npm install --legacy-peer-deps

# ─── Stage 2: Generate Prisma + Bundle ───────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY package.json ./
COPY packages/types     ./packages/types
COPY packages/database  ./packages/database
COPY apps/api           ./apps/api

# Generate Prisma client
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Bundle the API with esbuild
RUN cd apps/api && npx esbuild src/server.ts \
      --bundle \
      --platform=node \
      --target=node24 \
      --outfile=dist/server.js \
      --external:@prisma/client \
      --external:bcryptjs \
      --external:cloudinary \
      --external:multer \
      --external:passport \
      --external:passport-google-oauth20

# ─── Stage 3: Minimal production runner ───────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache wget openssl

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 expressjs

COPY --from=builder --chown=expressjs:nodejs /app/node_modules              ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/dist/server.js   ./server.js
COPY --from=builder --chown=expressjs:nodejs /app/packages/database/prisma  ./packages/database/prisma

COPY --chown=expressjs:nodejs apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER expressjs
EXPOSE 5000

ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node

ENTRYPOINT ["./entrypoint.sh"]
