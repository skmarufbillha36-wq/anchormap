# ADR-002: Separate Express.js Backend (Not Next.js API Routes)

**Status:** Accepted
**Date:** 2026-08-13
**Deciders:** Project team (explicit decision by project owner)

---

## Context

The initial project analysis proposed using Next.js API Routes as the backend layer
(the "full-stack Next.js" approach). This was corrected by the project owner.

Options considered:
1. **Next.js API Routes** — Backend logic inside Next.js `app/api/` directory
2. **Separate Express.js application** — Standalone Node.js server, separate from the frontend

---

## Decision

We use a **separate Node.js + Express.js + TypeScript backend application** (`apps/api`)
that is completely independent from the Next.js frontend.

The frontend calls the backend via HTTP REST API:
```
Next.js (apps/web) → HTTPS → Express API (apps/api) → PostgreSQL + PostGIS
```

---

## Rationale

### 1. Full Control Over the Backend

Express gives us complete control over the middleware stack, routing, request processing,
and response format. This is critical for a GIS application with complex spatial queries,
multi-table GIS operations, and a layered architecture (routes → controllers → services → repositories).

Next.js API routes run as serverless functions. They do not support persistent database
connection pools, long-running spatial operations, file upload middleware (Multer), or
the graceful shutdown patterns needed for a production backend.

### 2. Follows the Proven Pattern

The Blossom Flower Shop project (the team's first project) used the same architecture:
Next.js frontend + Express.js backend. This architecture is proven, documented, and understood
by the team.

### 3. The Repository Layer

The project implements a 4-layer architecture:
Routes → Controllers → Services → Repositories

This architecture requires a proper server framework. Next.js API routes encourage
inline logic without clear separation of concerns, making this layered pattern difficult
to enforce consistently.

### 4. GIS Query Complexity

PostGIS spatial queries use raw SQL via `prisma.$queryRaw`. A proper Express service layer
can organize these queries, handle PostGIS-specific error codes, and implement
GIS-specific business logic (coordinate validation, bounding box checks, distance calculations)
in a clean, testable way.

### 5. Docker Architecture

With a separate backend, each service has its own Dockerfile and runs in its own container.
This matches the Flower Shop Docker setup and is a clean, production-standard deployment model.

---

## Consequences

**Positive:**
- Full control over backend architecture
- Clean layered architecture (routes, controllers, services, repositories)
- Proper middleware stack (Helmet, CORS, rate limiting, Multer)
- Independent scaling of frontend and backend
- Matches the established pattern from Project 1

**Negative:**
- Two separate processes to start in development
- Additional Docker complexity (two Dockerfiles instead of one)
- CORS must be configured explicitly

---

## Alternatives Rejected

**Next.js API Routes (App Router):**
- Cannot run persistent connection pools
- Serverless functions restart between requests (PostGIS connection overhead)
- Difficult to enforce the 4-layer architectural pattern
- Does not support Multer middleware for file uploads
- Cannot implement graceful shutdown with Prisma disconnect
