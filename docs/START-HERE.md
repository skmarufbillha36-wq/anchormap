# 🗺️ AnchorMap — Start Here

Welcome to the AnchorMap (Ankara GIS) project documentation.

If you are new to this project, read this file first.

---

## What Is This Project?

**AnchorMap** is a professional-grade, interactive Geographic Information System (GIS) web application
focused on the city of Ankara, Turkey.

It serves as an interactive city guide combining education, healthcare, emergency services,
historical landmarks, cultural sites, and tourism — all on a real map with full geographic CRUD operations.

**University context:** GitHub & Vibe Coding Training / Work Experience — Second Project
**Institution:** Ostim Technical University
**Instructor:** Kürşat Enes Selçuk Yücel

---

## Where to Start

### I want to understand the project
→ Read [`docs/00-product/01-vision.md`](./00-product/01-vision.md)

### I want to understand the architecture
→ Read [`docs/10-architecture/01-system-architecture.md`](./10-architecture/01-system-architecture.md)

### I want to set up the project locally
→ Read [`docs/70-operations/01-local-development.md`](./70-operations/01-local-development.md)

### I want to understand the database
→ Read [`docs/40-data/01-database-schema.md`](./40-data/01-database-schema.md)

### I want to understand the API
→ Read [`docs/30-contracts/01-api-overview.md`](./30-contracts/01-api-overview.md)

### I want to understand why certain decisions were made
→ Read [`docs/80-adr/`](./80-adr/) — Architecture Decision Records

### I want to know what features exist
→ Read [`docs/90-registries/01-feature-registry.md`](./90-registries/01-feature-registry.md)

---

## System Overview

```
Browser (Next.js Frontend)
         │
         │ HTTPS REST API calls
         ▼
Express.js Backend (TypeScript)
         │
         ├── PostgreSQL + PostGIS (Supabase)
         │       Geographic data, users, reviews
         │
         └── Cloudinary
                 Image CDN, upload management
```

---

## Quick Reference

| Item | Value |
|---|---|
| Frontend port (dev) | `http://localhost:3000` |
| Backend port (dev) | `http://localhost:5000` |
| API base path | `/api/v1` |
| API health check | `GET /api/v1/health` |
| Admin dashboard | `/admin` |
| Map center | Ankara, Turkey (39.9334° N, 32.8597° E) |

---

## Key Decisions Already Made

| Decision | Choice | Rationale |
|---|---|---|
| Architecture | Monorepo, separate frontend + backend | Follows Flower Shop pattern, full control |
| Frontend | Next.js 14 + TypeScript | SSR, routing, ecosystem |
| Backend | Node.js + Express + TypeScript | Full control over REST API |
| Database | PostgreSQL + PostGIS (Supabase) | Industry GIS standard |
| ORM | Prisma + raw PostGIS queries | Type safety + spatial query power |
| Map | Leaflet.js + OpenStreetMap tiles | Free, no API key, production quality |
| Images | Cloudinary | CDN, free tier, consistent with Flower Shop |
| Auth | JWT (email/password + Google OAuth) | Stateless, same pattern as Flower Shop |
| Deployment | Docker + Vercel (frontend) | Reproducible, free tier |
| Language | English primary, Turkish secondary | Bilingual GIS content |

---

## Documentation Structure

```
docs/
├── 00-product/         Product vision, requirements, roadmap
├── 10-architecture/    System, backend, frontend, GIS, deployment diagrams
├── 20-domains/         Domain-specific documentation per entity
├── 30-contracts/       API contracts, request/response schemas
├── 40-data/            Database schema, GIS design, import pipeline
├── 50-engineering/     Coding standards, testing, workflow
├── 60-security/        Auth, RBAC, input validation, rate limiting
├── 70-operations/      Docker, local dev, deployment, CI/CD
├── 80-adr/             Architecture Decision Records
├── 90-registries/      Features, APIs, env vars, dependencies
├── 99-archive/         Superseded documents
├── scripts/            Helper scripts (import pipeline, etc.)
├── AGENTS.md           AI agent guidance for this project
├── README.md           Public-facing repository README
└── START-HERE.md       ← You are here
```

---

*Last updated: 2026-08-13*
