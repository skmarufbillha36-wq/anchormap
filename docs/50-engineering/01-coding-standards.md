# Coding Standards

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Language & Type Safety

- **TypeScript strict mode** is enabled on both frontend and backend
- **No `any` types** except where unavoidable (e.g., Prisma raw query results, which should be immediately typed with an interface)
- All shared types live in `packages/types/src/index.ts`
- All Zod schemas are co-located with the controller or in `src/validations/`

---

## Naming Conventions

### Files
| Type | Convention | Example |
|---|---|---|
| TypeScript source | `kebab-case.ts` | `location.service.ts` |
| React components | `PascalCase.tsx` | `LocationCard.tsx` |
| Configuration | `kebab-case.ts/js` | `env.ts`, `tailwind.config.js` |

### Variables and Functions
| Type | Convention | Example |
|---|---|---|
| Variables | `camelCase` | `locationData`, `avgRating` |
| Functions | `camelCase` | `getNearby()`, `validateCoords()` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RADIUS_METERS`, `ANKARA_BBOX` |
| Classes | `PascalCase` | `ApiError`, `ApiResponseBuilder` |
| TypeScript interfaces | `PascalCase` | `Location`, `CreateLocationDto` |
| TypeScript enums | `PascalCase` (keys: `SCREAMING_SNAKE`) | `LocationStatus.APPROVED` |

### Database Columns
- All column names use `snake_case` (enforced by Prisma `@map`)
- All table names use `snake_case` plural (enforced by Prisma `@@map`)

---

## Backend Architecture Rules

1. **Routes** have zero business logic — only middleware application and controller delegation
2. **Controllers** have zero business logic — only input extraction and response formatting
3. **Services** contain all business logic — no direct Prisma calls
4. **Repositories** contain all database access — no business rules
5. **Throw `new ApiError()`** for all expected errors — never `res.status(...)` directly
6. **Never use `prisma.$queryRawUnsafe`** — use tagged template literals instead

---

## API Response Standard

All API responses must use `ApiResponseBuilder`:

```typescript
// Success:
res.status(200).json(ApiResponseBuilder.success('Message.', data));
res.status(201).json(ApiResponseBuilder.success('Created.', data));

// Error (via throw — handled by errorMiddleware):
throw new ApiError(404, 'Location not found.');
throw new ApiError(400, 'Validation failed', errors);
```

---

## Comment Standards

- Every service method gets a JSDoc comment explaining: what it does, business rules, edge cases
- Every repository method gets a JSDoc comment explaining the query
- Routes get inline comments for each endpoint (`/** GET /api/v1/locations/:slug */`)
- No code comments explaining obvious things (avoid `// increment i`)

---

## Error Handling

```typescript
// CORRECT: Use ApiError
if (!location) throw new ApiError(404, 'Location not found.');

// WRONG: Direct response manipulation in service/repository
if (!location) res.status(404).json({ error: '...' });

// WRONG: Swallowing errors
try { ... } catch {}

// CORRECT: Let errors propagate (express-async-errors handles them)
```

---

## Frontend Patterns

- **Never import Leaflet at the top level** of any file that could be SSR'd
- **All API calls go through `lib/api.ts`** — never raw `fetch()` or direct `axios`
- **Zustand stores** are the only global state — no React Context for app state
- **Loading states** use Skeleton components — never just "loading..."

---

*Document owner: Project team*
*Last updated: 2026-08-13*
