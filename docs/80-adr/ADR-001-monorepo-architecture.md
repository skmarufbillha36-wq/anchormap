# ADR-001: Monorepo Architecture with npm Workspaces

**Status:** Accepted
**Date:** 2026-08-13
**Deciders:** Project team

---

## Context

The AnchorMap project has two distinct applications (frontend and backend) and needs to share
TypeScript type definitions between them. We need to decide how to structure the repository.

Options considered:
1. **Monorepo** — one Git repository containing all applications and shared packages
2. **Polyrepo** — separate Git repositories for frontend, backend, and shared types

---

## Decision

We adopt a **monorepo structure using npm Workspaces**, with the following packages:

```
apps/api      → Express.js backend
apps/web      → Next.js frontend
packages/database  → Prisma schema + client singleton
packages/types     → Shared TypeScript interfaces and DTOs
```

This mirrors the architecture proven in the Blossom Flower Shop project (the team's first project).

---

## Rationale

**Shared types are critical for a GIS API.** Geographic data types (Location, Category, GeoJSON,
coordinate types) are complex. Without a shared type package, the frontend and backend
can silently diverge — the API returns `lat` but the frontend expects `latitude`.

In the Flower Shop project, the `packages/types` workspace eliminated this entire class of bugs
by providing a single source of truth for all TypeScript interfaces.

**Developer experience.** One `npm run dev` command starts both services. One `git clone` gives
a new developer the entire system. One PR includes coordinated frontend + backend changes.

**Simpler Docker build context.** The monorepo root is the Docker build context, which means
both Dockerfiles can copy from `packages/` without cross-repository coordination.

---

## Consequences

**Positive:**
- TypeScript type safety across the full stack
- Consistent development workflow
- Shared Prettier + ESLint configuration
- Coordinated deployments

**Negative:**
- Slightly more complex initial setup
- `npm install` at the root installs all workspace dependencies together

---

## Alternatives Rejected

**Polyrepo:** Requires separate repositories, separate CI/CD, a published npm package or Git
submodule for shared types, and coordinated deployments for related changes. The overhead
is not justified for a project of this size.
