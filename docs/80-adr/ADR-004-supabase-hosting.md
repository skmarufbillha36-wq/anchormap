# ADR-004: Supabase as PostgreSQL + PostGIS Hosting

**Status:** Accepted
**Date:** 2026-08-13

---

## Context

We need managed PostgreSQL + PostGIS hosting that is free-tier compatible, easy to set up,
and reliable for production use. We evaluated several options.

---

## Decision

We use **Supabase** as the managed PostgreSQL + PostGIS host.

Supabase is used **only as the database hosting layer**.
We do NOT use Supabase Auth, Supabase Storage, or Supabase client libraries.
All business logic, authentication, and data access goes through our custom Express backend.

---

## Rationale

**PostGIS is enabled by default.** On Supabase, PostGIS is available as a one-click
extension without any manual server configuration. Railway and Render require manual
PostGIS installation and configuration.

**Free tier is sufficient.** Supabase free tier provides:
- 500MB database storage
- Unlimited API requests to PostgreSQL
- Automatic daily backups
- Visual table editor (useful for admin verification)

500MB is more than enough for thousands of location records. A PostGIS geometry point
uses approximately 50 bytes; 1,000,000 locations would use ~50MB for geometry alone.

**pg_trgm and unaccent are available.** These PostgreSQL extensions (needed for
Turkish full-text search) are available on Supabase via the Extensions page.

**Visual dashboard.** The Supabase dashboard provides a visual table editor and
SQL runner, useful for verifying import results and debugging during development.

---

## What Supabase Does NOT Replace

| Concern | Our Solution | Not Supabase |
|---|---|---|
| Authentication | Custom JWT via Express | Not Supabase Auth |
| Authorization | Express middleware (RBAC) | Not Supabase Row Level Security |
| API | Express REST API | Not Supabase PostgREST |
| Storage | Cloudinary | Not Supabase Storage |
| Real-time | Not needed in Phase 1 | Not Supabase Realtime |

---

## Connection Strategy

The Express backend connects to Supabase PostgreSQL using the standard
PostgreSQL connection string:

```
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

Prisma manages the connection pool. PostGIS is accessed via `prisma.$queryRaw`.

---

## Alternatives Rejected

**Railway PostgreSQL:** Does not have PostGIS enabled by default. Manual installation
requires running SQL commands with superuser access, which Railway does not always provide.

**Render PostgreSQL (free tier):** Free tier database is deleted after 90 days of inactivity.
Not suitable for a production deployment.

**Neon PostgreSQL:** Supports PostGIS but has a different connection model
(serverless branching). Works, but adds complexity. Supabase has a better free tier
for persistent connections from a long-running Express server.

**Self-hosted PostgreSQL (VPS):** Requires managing the server, backups, security patches.
Out of scope for a free-tier project.
