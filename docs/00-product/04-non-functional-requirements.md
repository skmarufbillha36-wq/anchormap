# Non-Functional Requirements

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## NFR-PERF — Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-PERF-001 | API response time for standard location queries (viewport bbox) | < 300ms at p95 |
| NFR-PERF-002 | API response time for spatial proximity queries (nearby) | < 500ms at p95 |
| NFR-PERF-003 | API response time for full-text search | < 400ms at p95 |
| NFR-PERF-004 | Map initial load with 200+ visible markers | < 2 seconds |
| NFR-PERF-005 | Location detail page load (SSR) | < 1.5 seconds |
| NFR-PERF-006 | Image load time (Cloudinary CDN) | < 1 second (optimized) |
| NFR-PERF-007 | The database shall have a GIST spatial index on all geometry columns | Required |
| NFR-PERF-008 | The database shall have full-text search indexes (GIN) on name and description | Required |
| NFR-PERF-009 | Marker clustering shall prevent more than 500 individual DOM elements at any zoom level | Required |

---

## NFR-SCALE — Scalability

| ID | Requirement |
|---|---|
| NFR-SCALE-001 | The database schema and spatial indexes shall support up to 100,000 locations without query degradation |
| NFR-SCALE-002 | The API shall use viewport-based loading — only locations in the visible map area are fetched |
| NFR-SCALE-003 | The system shall support pagination on all list endpoints (page + limit) |
| NFR-SCALE-004 | Image storage (Cloudinary CDN) shall not depend on the API server's disk capacity |
| NFR-SCALE-005 | The Express backend shall be stateless — no session data stored in memory |

---

## NFR-SEC — Security

| ID | Requirement |
|---|---|
| NFR-SEC-001 | All API routes shall validate inputs using Zod schemas before processing |
| NFR-SEC-002 | All database queries shall use parameterized statements (Prisma ORM) — no raw string interpolation |
| NFR-SEC-003 | Passwords shall be hashed using bcrypt with a minimum cost factor of 12 |
| NFR-SEC-004 | JWT secrets shall be at least 64 characters and stored only in environment variables |
| NFR-SEC-005 | All admin API routes shall verify both authentication (JWT) and authorization (role = ADMIN) |
| NFR-SEC-006 | Coordinate inputs shall be validated: lat ∈ [39.0, 41.0], lng ∈ [31.5, 34.0] (Ankara region) |
| NFR-SEC-007 | File uploads shall validate MIME type (image/jpeg, image/png, image/webp) and maximum size (5MB) |
| NFR-SEC-008 | The API shall set security HTTP headers via Helmet.js |
| NFR-SEC-009 | CORS shall be configured to allow only trusted origins (frontend domain) |
| NFR-SEC-010 | Sensitive data (passwords, tokens, API keys) shall never appear in logs or error responses |
| NFR-SEC-011 | All secrets shall be stored in environment variables, never committed to Git |

---

## NFR-AVAIL — Availability

| ID | Requirement |
|---|---|
| NFR-AVAIL-001 | The application shall target 99% uptime (within free-tier constraints) |
| NFR-AVAIL-002 | The API shall expose a `/api/v1/health` endpoint returning `{ status: "ok" }` |
| NFR-AVAIL-003 | Database connection failure shall cause a clean server startup failure (not silent corruption) |
| NFR-AVAIL-004 | Docker containers shall include health checks to detect and restart unhealthy services |
| NFR-AVAIL-005 | Graceful shutdown shall be implemented (SIGTERM → close DB connections → exit) |

---

## NFR-MAINT — Maintainability

| ID | Requirement |
|---|---|
| NFR-MAINT-001 | The codebase shall follow consistent naming conventions defined in `docs/50-engineering/01-coding-standards.md` |
| NFR-MAINT-002 | All API routes shall be documented in `docs/30-contracts/` |
| NFR-MAINT-003 | Every major architectural decision shall have an ADR in `docs/80-adr/` |
| NFR-MAINT-004 | The Prisma schema shall be the single source of truth for the database structure |
| NFR-MAINT-005 | Database changes shall use Prisma migrations — never manual SQL edits to production |
| NFR-MAINT-006 | The monorepo shall use npm workspaces for dependency management |
| NFR-MAINT-007 | TypeScript strict mode shall be enabled on both frontend and backend |
| NFR-MAINT-008 | Each layer (route → controller → service → repository) shall have a single, defined responsibility |

---

## NFR-UX — User Experience

| ID | Requirement |
|---|---|
| NFR-UX-001 | The application shall be responsive and usable on mobile devices (min-width: 375px) |
| NFR-UX-002 | Loading states shall display skeleton UI (not blank screens or spinners) |
| NFR-UX-003 | All user actions shall provide feedback (success toast, error message, or loading indicator) |
| NFR-UX-004 | The application shall support keyboard navigation on all interactive elements |
| NFR-UX-005 | Map marker popups shall be accessible with keyboard navigation |
| NFR-UX-006 | Error pages (404, 500) shall be custom-designed and include navigation back to the map |
| NFR-UX-007 | The application shall use Inter font (Latin + Turkish character support) from Google Fonts |
| NFR-UX-008 | Empty states (no search results, no favorites) shall include a helpful message and action |

---

## NFR-I18N — Internationalization

| ID | Requirement |
|---|---|
| NFR-I18N-001 | Location names shall support both English (name) and Turkish (name_tr) fields |
| NFR-I18N-002 | The UI shall be written in English; Turkish is used for data content only (Phase 1) |
| NFR-I18N-003 | Search shall match against both name and name_tr |
| NFR-I18N-004 | The database shall use UTF-8 encoding with full Turkish character support (ı, ğ, ş, ç, ö, ü) |
| NFR-I18N-005 | Full-text search shall use both 'english' and 'turkish' PostgreSQL text search configurations |
| NFR-I18N-006 | URL slugs shall be ASCII-safe (English, no Turkish special characters) |

---

## NFR-DEPLOY — Deployment & Operations

| ID | Requirement |
|---|---|
| NFR-DEPLOY-001 | The project shall be runnable via `docker compose up --build` with no manual pre-configuration beyond environment variables |
| NFR-DEPLOY-002 | Separate Docker configurations shall exist for development and production |
| NFR-DEPLOY-003 | Database migrations shall run automatically on container startup (not manually) |
| NFR-DEPLOY-004 | Environment variables shall never be hardcoded — only in .env files excluded from Git |
| NFR-DEPLOY-005 | The production frontend shall be deployable to Vercel |
| NFR-DEPLOY-006 | The production backend shall be deployable to a container-friendly platform (Railway, Render, or Fly.io) |
| NFR-DEPLOY-007 | The production database shall be hosted on Supabase (managed PostgreSQL + PostGIS) |
| NFR-DEPLOY-008 | A Makefile shall provide standard developer commands (make up, make down, make seed, make logs) |

---

*Document owner: Project team*
*Last updated: 2026-08-13*
