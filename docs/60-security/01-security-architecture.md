# Security Architecture

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Overview

This document describes the security model for AnchorMap, covering authentication,
authorization (RBAC), API security, input validation, and data protection.

---

## Authentication

### JWT Token Strategy

AnchorMap uses **stateless JWT authentication** — the same pattern as the Flower Shop project.

```
Access Token:
  - Payload: { userId, role, iat, exp }
  - Expiry: 24 hours
  - Transport: Authorization: Bearer <token> header
  - Storage (client): localStorage or in-memory

Refresh Token:
  - Payload: { userId }
  - Expiry: 7 days
  - Transport: HttpOnly, Secure, SameSite=Strict cookie
  - Storage: HttpOnly cookie (not accessible to JavaScript)

JWT_SECRET: minimum 64 characters, stored only in environment variables
```

### Token Lifecycle

```
Login → access token (24h) + refresh token (7d cookie)
API request → Authorization: Bearer <access_token>
Token expires → POST /auth/refresh → new access token (no re-login)
Refresh expires → User must log in again
Logout → Clear refresh token cookie (server-side) + clear localStorage (client-side)
```

### Password Security

```
Hashing algorithm: bcrypt
Cost factor: 12 (deliberately slow — resistant to brute force)
Storage: password_hash column (only)
Logging: Password is NEVER logged
Response: password_hash is NEVER returned in any API response
```

### Google OAuth

```
Flow: Authorization Code (via Passport.js Google Strategy)
Provider: Google
Stored: email, name, avatar_url (from Google profile)
password_hash: NULL for OAuth users
email_verified: TRUE always (Google verifies email)
```

---

## Authorization (RBAC)

Role-Based Access Control is implemented at the Express middleware level.

### Roles

```
USER  → Registered user (default)
ADMIN → Administrator (manually promoted)
```

### Middleware Chain

```typescript
// Public endpoint:
router.get('/locations', locationsController.getAll);

// Authenticated endpoint:
router.post('/reviews/:id/flag', authenticate, reviewsController.flag);

// Admin-only endpoint:
router.post('/admin/locations', authenticate, requireAdmin, validate(createLocationSchema), adminLocationsController.create);
```

### authenticate Middleware

```typescript
// Reads Authorization: Bearer <token>
// Verifies JWT signature
// Attaches req.user = { userId, role }
// Throws ApiError(401) if token missing, invalid, or expired
```

### requireAdmin Middleware

```typescript
// Must be chained AFTER authenticate
// Throws ApiError(403) if req.user.role !== 'ADMIN'
// Every admin API endpoint independently enforces this
```

**The frontend admin route guard is a UX convenience. The backend RBAC is the security boundary.**

---

## Input Validation

Every API endpoint that accepts user input is protected by Zod schema validation
via the `validate` middleware.

```typescript
// Coordinate bounds check (Ankara region)
const createLocationSchema = z.object({
  name: z.string().min(2).max(200),
  lat: z.number().min(39.0).max(41.0),      // Ankara latitude range
  lng: z.number().min(31.5).max(34.0),      // Ankara longitude range
  categoryId: z.string().uuid(),
  status: z.enum(['pending', 'approved']),
  ...
});
```

Validation failures return HTTP 400 with field-level error messages:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "lat": ["Latitude must be between 39.0 and 41.0"],
    "name": ["Name is required"]
  }
}
```

---

## SQL Injection Prevention

All database operations use:
1. **Prisma ORM** for standard CRUD (fully parameterized)
2. **Tagged template literals** for PostGIS raw queries (automatically parameterized)

```typescript
// SAFE: Tagged template = parameterized
const result = await prisma.$queryRaw`
  SELECT * FROM locations
  WHERE district = ${district}     -- ← Parameterized, not string-interpolated
`;

// NEVER do this:
// prisma.$queryRawUnsafe(`SELECT * FROM locations WHERE district = '${district}'`)
```

`prisma.$queryRawUnsafe` is NEVER used in this codebase.

---

## File Upload Security

```typescript
// Multer configuration (upload.routes.ts)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB maximum
    files: 5,                    // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});
```

**Only Admin users can upload location photos.** The upload route requires both
`authenticate` and `requireAdmin` middleware.

---

## API Security Headers (Helmet.js)

```typescript
app.use(helmet());
// Sets:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY (prevents clickjacking)
// X-XSS-Protection: 1; mode=block
// Strict-Transport-Security: max-age=15552000 (HTTPS enforcement)
// Content-Security-Policy: default-src 'self'
// Referrer-Policy: no-referrer
```

---

## CORS Configuration

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL,    // Production frontend URL
  ],
  credentials: true,             // Required for refresh token cookie
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

Requests from any origin not in the `origin` list are rejected with CORS errors.

---

## Rate Limiting

Auth endpoints and review endpoints are rate-limited to prevent brute force and spam.

```typescript
// Using express-rate-limit:
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                     // 10 login attempts per window
  message: { success: false, message: 'Too many requests. Try again in 15 minutes.' },
});
router.post('/auth/login', authLimiter, ...);

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,                     // 20 reviews per hour per IP
});
router.post('/reviews', authenticate, reviewLimiter, ...);
```

---

## Environment Variables Security

```
NEVER commit secrets to Git.
NEVER log secrets.
NEVER return secrets in API responses.

Required in .gitignore:
  .env
  .env.local
  .env.docker
  apps/api/.env
  apps/web/.env.local

All secrets are injected at runtime via environment variables:
  DATABASE_URL          (Supabase connection string)
  JWT_SECRET            (minimum 64 characters)
  CLOUDINARY_API_SECRET (image upload secret)
  GOOGLE_CLIENT_SECRET  (OAuth secret)
```

---

## Admin Security

The Admin Dashboard is protected by three layers:

1. **Frontend route guard**: `middleware.ts` in Next.js redirects unauthenticated users
2. **Frontend role check**: Admin pages verify `user.role === 'ADMIN'` client-side
3. **Backend RBAC**: Every admin API endpoint independently verifies role with `requireAdmin` middleware

If a user bypasses the frontend (e.g., via direct API call with a valid USER token),
the backend will still return HTTP 403 for any admin endpoint.

### Audit Trail

Every admin write action is recorded in `audit_log`:
- Who performed the action (user_id)
- What action was performed (CREATE, UPDATE, DELETE, APPROVE, etc.)
- Which record was affected (entity_type, entity_id)
- What changed (before/after JSON snapshot)
- When it happened (created_at timestamp)

This provides accountability for all data changes and allows rollback analysis.

---

*Document owner: Project team*
*Last updated: 2026-08-13*
