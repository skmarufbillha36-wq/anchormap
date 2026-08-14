# ─── Stage 1: Deps ────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json       ./apps/web/

RUN npm install --legacy-peer-deps

# ─── Stage 2: Builder ─────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY package.json ./
COPY packages/types ./packages/types
COPY apps/web       ./apps/web

ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN cd apps/web && npm run build

# ─── Stage 3: Runner ──────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
