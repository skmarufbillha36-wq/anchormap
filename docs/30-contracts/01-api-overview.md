# API Overview & Conventions

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Base URL

| Environment | Base URL |
|---|---|
| Development | `http://localhost:5000/api/v1` |
| Production | `https://api.anchormap.example.com/api/v1` |

All endpoints are prefixed with `/api/v1`.

---

## Standard Response Envelope

Every API response uses the same JSON envelope structure, regardless of success or failure.

### Success Response

```json
{
  "success": true,
  "message": "Human-readable description of the result.",
  "data": { ... }
}
```

### Success Response with Pagination

```json
{
  "success": true,
  "message": "Locations fetched.",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 342,
    "totalPages": 18
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Human-readable error description.",
  "errors": {
    "name": ["Name is required.", "Name must be at least 2 characters."],
    "lat": ["Latitude must be between 39.5 and 40.2."]
  }
}
```

The `errors` object is only present for validation errors (HTTP 400).

---

## HTTP Status Codes

| Code | Meaning | When Used |
|---|---|---|
| `200 OK` | Request succeeded | GET, PUT, PATCH, DELETE success |
| `201 Created` | Resource created | POST success (new resource) |
| `400 Bad Request` | Validation failed | Invalid input, missing required fields |
| `401 Unauthorized` | Not authenticated | Missing or invalid JWT token |
| `403 Forbidden` | Not authorized | Valid token but insufficient role |
| `404 Not Found` | Resource not found | ID/slug not in database |
| `409 Conflict` | Duplicate record | Email already registered, duplicate OSM ID |
| `422 Unprocessable Entity` | Semantic error | Valid format but invalid business logic |
| `429 Too Many Requests` | Rate limited | Auth or review endpoints |
| `500 Internal Server Error` | Server error | Unexpected failure (details hidden in production) |

---

## Authentication

Protected endpoints require a JWT access token in the Authorization header.

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `POST /api/v1/auth/login` or `POST /api/v1/auth/google`.

Tokens expire after **24 hours**. Use `POST /api/v1/auth/refresh` with the refresh token
cookie to obtain a new access token without re-logging in.

---

## Pagination

List endpoints support pagination via query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Items per page (max: 100) |

---

## Filtering Conventions

Filters are passed as query string parameters:

```
GET /api/v1/locations?categoryId=uuid&district=Çankaya&status=approved&page=1&limit=20
```

All filter parameters are optional. Omitting a filter returns all records matching the remaining filters.

---

## Spatial Query Parameters

Geographic endpoints accept bounding box and proximity parameters:

| Parameter | Type | Description |
|---|---|---|
| `minLat` | float | Bounding box south edge (latitude) |
| `maxLat` | float | Bounding box north edge (latitude) |
| `minLng` | float | Bounding box west edge (longitude) |
| `maxLng` | float | Bounding box east edge (longitude) |
| `lat` | float | Center latitude (for proximity queries) |
| `lng` | float | Center longitude (for proximity queries) |
| `radius` | int | Radius in meters (default: 1000, max: 50000) |

---

## Endpoint Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register with email + password |
| POST | `/auth/login` | None | Login, receive access + refresh tokens |
| POST | `/auth/google` | None | Google OAuth login |
| POST | `/auth/logout` | JWT | Logout (clear refresh token cookie) |
| GET | `/auth/me` | JWT | Get current user profile |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/forgot-password` | None | Send password reset email |
| POST | `/auth/reset-password` | None | Reset password with token |

### Locations (Public)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/locations` | None | List locations (supports bbox, category, district, search, openNow filters) |
| GET | `/locations/:slug` | None | Get single location by slug |
| GET | `/locations/:id/nearby` | None | Get nearby locations (lat, lng, radius) |

### Categories (Public)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/categories` | None | List all categories (with subcategories) |
| GET | `/categories/:slug` | None | Get single category + its locations |

### Search

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/search?q=` | None | Full-text search across locations |

### Reviews (Authenticated)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/locations/:id/reviews` | None | Get reviews for a location |
| POST | `/locations/:id/reviews` | JWT | Create review + rating |
| PATCH | `/reviews/:id` | JWT | Update own review |
| DELETE | `/reviews/:id` | JWT | Delete own review |
| POST | `/reviews/:id/flag` | JWT | Flag a review as inappropriate |

### Favorites (Authenticated)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/favorites` | JWT | Get current user's favorites |
| POST | `/favorites/:locationId` | JWT | Add to favorites |
| DELETE | `/favorites/:locationId` | JWT | Remove from favorites |

### Reports (Authenticated)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/reports` | JWT | Report a location for inaccuracy |

### Suggestions (Authenticated)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/suggestions` | JWT | Suggest a new location |

### Upload (Admin)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/upload/locations/:id` | JWT + Admin | Upload photos for a location |
| DELETE | `/upload/photos/:id` | JWT + Admin | Delete a photo |

### Admin — Locations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/locations` | Admin | All locations (any status, with filters) |
| POST | `/admin/locations` | Admin | Create a new location |
| PATCH | `/admin/locations/:id` | Admin | Update any location field |
| DELETE | `/admin/locations/:id` | Admin | Soft-delete a location |
| DELETE | `/admin/locations/:id/hard` | Admin | Hard-delete a location |
| POST | `/admin/locations/:id/approve` | Admin | Approve a pending location |
| POST | `/admin/locations/:id/reject` | Admin | Reject a pending location |
| POST | `/admin/locations/bulk-approve` | Admin | Bulk-approve locations by IDs |

### Admin — Categories

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/categories` | Admin | All categories |
| POST | `/admin/categories` | Admin | Create category |
| PATCH | `/admin/categories/:id` | Admin | Update category |
| DELETE | `/admin/categories/:id` | Admin | Delete category |

### Admin — Reviews

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/reviews` | Admin | All reviews (supports status filter) |
| PATCH | `/admin/reviews/:id/hide` | Admin | Hide a review |
| DELETE | `/admin/reviews/:id` | Admin | Delete a review |

### Admin — Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/reports` | Admin | All reports (supports status filter) |
| PATCH | `/admin/reports/:id` | Admin | Resolve or dismiss a report |

### Admin — Suggestions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/suggestions` | Admin | All suggestions |
| POST | `/admin/suggestions/:id/approve` | Admin | Approve + create location from suggestion |
| POST | `/admin/suggestions/:id/reject` | Admin | Reject a suggestion |

### Admin — Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/users` | Admin | Paginated user list |
| PATCH | `/admin/users/:id/role` | Admin | Change user role |

### Admin — Audit Log

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/audit-log` | Admin | Paginated audit log |

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Health check |

---

## Detailed Request/Response schemas

See individual domain contract files:
- [`02-locations-api.md`](./02-locations-api.md)
- [`03-auth-api.md`](./03-auth-api.md)
- [`04-reviews-api.md`](./04-reviews-api.md)
- [`05-admin-api.md`](./05-admin-api.md)

---

*Document owner: Project team*
*Last updated: 2026-08-13*
