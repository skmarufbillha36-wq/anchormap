# User Personas & Roles

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Overview

AnchorMap has three distinct user roles with different capabilities and access levels.

```
┌─────────────────────────────────────────────────────┐
│                     ADMIN                            │
│   Full geographic CRUD, moderation, system mgmt      │
├─────────────────────────────────────────────────────┤
│                REGISTERED USER                       │
│   Everything a visitor can do + ratings,             │
│   reviews, favorites, suggestions, reports           │
├─────────────────────────────────────────────────────┤
│                  VISITOR (Public)                    │
│   View map, search, filter, view details,            │
│   find nearby, emergency panel                       │
└─────────────────────────────────────────────────────┘
```

---

## Persona 1: Visitor (Public / Unauthenticated)

### Who They Are

- A tourist visiting Ankara for the first time
- A new resident trying to find services
- A student looking for nearby healthcare or government offices
- A local resident quickly checking emergency services

### Goals

- Find a specific type of location (hospital, museum, pharmacy) quickly
- Understand how far away a location is from their current position
- See what is available in a specific district of Ankara
- Get basic contact information and website for a location
- Find emergency services instantly

### Frustrations

- Generic maps do not filter by meaningful categories
- Information is scattered across multiple websites
- Cannot easily find "the nearest pharmacy in Çankaya"
- Emergency service locations are not easily discoverable

### Permissions

| Action | Allowed |
|---|---|
| View the interactive map | ✅ |
| Browse all approved locations | ✅ |
| Search by name (English + Turkish) | ✅ |
| Filter by category | ✅ |
| Filter by district | ✅ |
| View location detail page | ✅ |
| Find nearby locations (by distance) | ✅ |
| View emergency quick-panel | ✅ |
| View reviews and ratings | ✅ |
| View location photos | ✅ |
| Share a location link | ✅ |
| Write reviews | ❌ (must register) |
| Rate locations | ❌ (must register) |
| Favorite locations | ❌ (must register) |
| Suggest a new location | ❌ (must register) |
| Access Admin Dashboard | ❌ |

---

## Persona 2: Registered User (Authenticated)

### Who They Are

- A regular Ankara resident who wants to contribute to the map
- A student or professional who wants to save useful locations
- Someone who has used the map and wants to share their experience

### Goals

- Save useful locations for quick future access
- Rate and review locations they have visited
- Report incorrect or outdated location information
- Suggest missing locations to improve the dataset

### Additional Permissions (beyond Visitor)

| Action | Allowed |
|---|---|
| Rate locations (1–5 stars) | ✅ |
| Write reviews / comments | ✅ |
| Edit or delete own reviews | ✅ |
| Flag a review as inappropriate | ✅ |
| Favorite / unfavorite locations | ✅ |
| View personal favorites list | ✅ |
| View personal review history | ✅ |
| Report a location for inaccuracy | ✅ |
| Suggest a new location | ✅ |
| Modify core geographic data directly | ❌ (Admin only) |
| Access Admin Dashboard | ❌ |

### Authentication

- Registers via email + password OR Google OAuth
- Email verification required for email registrations
- JWT token used for all authenticated requests

---

## Persona 3: Admin

### Who They Are

- The course instructor or project maintainer
- A trusted operator responsible for data quality
- The only person allowed to modify core geographic data

### Goals

- Import, review, and curate geographic data from OpenStreetMap
- Maintain the quality of the location database
- Moderate user-generated content (reviews, suggestions, reports)
- Manage application data categories

### Additional Permissions (beyond Registered User)

| Action | Allowed |
|---|---|
| Access Admin Dashboard | ✅ |
| Create new locations | ✅ |
| Edit any location | ✅ |
| Delete locations (soft delete) | ✅ |
| Hard delete locations | ✅ |
| Approve imported (pending) locations | ✅ |
| Reject imported locations | ✅ |
| Create, edit, delete categories | ✅ |
| View all user reviews | ✅ |
| Hide or delete any review | ✅ |
| View and action inaccuracy reports | ✅ |
| View and action location suggestions | ✅ |
| View user list | ✅ |
| Promote a user to Admin | ✅ (future) |
| View audit log | ✅ |

### Admin Dashboard Sections

- Dashboard home (stats overview)
- Locations table (with search, filter, status)
- Location create / edit form
- Import queue (pending OSM-imported locations)
- Categories management
- Reviews moderation
- Inaccuracy reports queue
- Location suggestions queue
- Users list
- Audit log

---

## Role Inheritance

```
Admin
  └─ inherits all Registered User permissions
       └─ inherits all Visitor permissions
```

Role is stored in the `users` table as an enum: `USER` | `ADMIN`.

Only one Admin role exists in Phase 1. Role promotion is a manual operation by
an existing Admin via the Admin Dashboard users section.

---

## Authentication Flow

```
Registration (email):
  User submits email + password
  → Password hashed (bcrypt, cost 12)
  → Email verification link sent
  → User verifies email
  → JWT issued on next login

Registration (Google OAuth):
  User clicks "Sign in with Google"
  → Google OAuth redirect
  → User profile received
  → Account created (role: USER, email_verified: true)
  → JWT issued

Login:
  User submits email + password
  → bcrypt compare
  → JWT issued (24h expiry)
  → Refresh token issued (7d expiry)

All subsequent requests:
  Authorization: Bearer <jwt>
  → Backend verifies signature
  → req.user = { userId, role }
  → Role checked per route
```

---

*Document owner: Project team*
*Last updated: 2026-08-13*
