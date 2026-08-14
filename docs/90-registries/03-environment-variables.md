# Environment Variables Registry

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Backend (apps/api/.env)

| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | Yes | Runtime environment | `development` / `production` |
| `PORT` | Yes | Express server port | `5000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://postgres:pw@localhost:5432/ankara_gis` |
| `JWT_SECRET` | Yes | JWT signing secret (min 64 chars) | `your-super-secret-key-64-chars-minimum` |
| `JWT_EXPIRES_IN` | Yes | Access token expiry | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | Yes | Refresh token expiry | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account name | `my-cloud` |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret | `abc123...` |
| `GOOGLE_CLIENT_ID` | For OAuth | Google OAuth client ID | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | For OAuth | Google OAuth client secret | `GOCSPX-...` |
| `FRONTEND_URL` | Yes | Frontend origin for CORS | `http://localhost:3000` |

## Frontend (apps/web/.env.local)

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (public) | `http://localhost:5000/api/v1` |

## Docker (.env.docker — root level)

Used when running with `docker compose`. Combines backend and frontend variables.

---

## Environment File Locations

```
.env.example             → Template (committed to Git — no real values)
.env.docker              → Docker Compose overrides (NOT committed to Git)
apps/api/.env            → Local development (NOT committed to Git)
apps/web/.env.local      → Local Next.js dev (NOT committed to Git)
```

**All .env files except .env.example are in .gitignore.**

---

*Document owner: Project team*
*Last updated: 2026-08-13*
