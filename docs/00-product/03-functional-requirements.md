# Functional Requirements

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0
**Status:** Agreed and final (pending user confirmation of open items)

---

## FR-MAP — Map & Navigation

| ID | Requirement | Priority | Role |
|---|---|---|---|
| FR-MAP-001 | The system shall display an interactive Leaflet.js map centered on Ankara (39.9334° N, 32.8597° E) at zoom level 12 on initial load | Must | All |
| FR-MAP-002 | The map shall use OpenStreetMap tiles as the base layer | Must | All |
| FR-MAP-003 | Approved locations shall appear as markers on the map | Must | All |
| FR-MAP-004 | Markers shall be clustered when zoomed out using Leaflet.markercluster | Must | All |
| FR-MAP-005 | Markers shall use distinct icons and colors per category | Must | All |
| FR-MAP-006 | Clicking a marker shall open a location detail panel (sidebar) without navigating away | Must | All |
| FR-MAP-007 | The map shall load only markers visible within the current viewport (viewport-based loading) | Must | All |
| FR-MAP-008 | District administrative boundaries shall be available as a toggleable GeoJSON overlay | Should | All |
| FR-MAP-009 | The user's current location (GPS/browser geolocation) shall optionally be shown on the map | Could | All |
| FR-MAP-010 | The map shall support smooth pan and zoom interactions | Must | All |

---

## FR-LOC — Location Data & Details

| ID | Requirement | Priority | Role |
|---|---|---|---|
| FR-LOC-001 | Each location shall have: name (English), name_tr (Turkish), category, coordinates (lat/lng), address, district | Must | — |
| FR-LOC-002 | Each location shall optionally have: description, phone, website, email, Instagram, opening hours, tags, accessibility notes, photos | Should | — |
| FR-LOC-003 | Clicking a location shall open a detail view with all available information | Must | All |
| FR-LOC-004 | Location detail view shall show: name, category, address, district, description, opening hours, contact info, photos, average rating, review count, and a "Find Nearby" action | Must | All |
| FR-LOC-005 | Each location shall have a permanent shareable URL (`/locations/[slug]`) | Must | All |
| FR-LOC-006 | Location opening hours shall use structured per-day format (Mon–Sun, open/close time or closed) | Should | — |
| FR-LOC-007 | Opening hours shall support an "Open Now" indicator based on current local time | Should | All |
| FR-LOC-008 | Location photos shall be stored via Cloudinary and delivered via CDN | Must | — |
| FR-LOC-009 | Each location shall have a computed average rating and review count | Must | All |

---

## FR-SEARCH — Search & Filtering

| ID | Requirement | Priority | Role |
|---|---|---|---|
| FR-SEARCH-001 | The system shall support full-text search by location name (English and Turkish) | Must | All |
| FR-SEARCH-002 | Search shall be case-insensitive and accent-insensitive (handles Turkish characters: ı, ğ, ş, ç, ö, ü) | Must | All |
| FR-SEARCH-003 | The system shall support filtering by one or more categories simultaneously | Must | All |
| FR-SEARCH-004 | The system shall support filtering by Ankara district | Should | All |
| FR-SEARCH-005 | The system shall support "Open Now" filtering based on current time | Should | All |
| FR-SEARCH-006 | The system shall return nearby locations sorted by distance (ascending) given a center point and radius | Must | All |
| FR-SEARCH-007 | Search results shall update both the map markers and a sidebar/list view | Must | All |
| FR-SEARCH-008 | An Emergency quick-access panel shall show Police, Hospital, and Fire Station locations with one click | Must | All |

---

## FR-AUTH — Authentication

| ID | Requirement | Priority | Role |
|---|---|---|---|
| FR-AUTH-001 | Users shall be able to register with email + password | Must | — |
| FR-AUTH-002 | Users shall be able to register or sign in with Google OAuth | Must | — |
| FR-AUTH-003 | Email registrations shall require email verification before the account is active | Should | — |
| FR-AUTH-004 | Users shall be able to log in with email + password | Must | — |
| FR-AUTH-005 | Users shall be able to request a password reset via email | Should | — |
| FR-AUTH-006 | JWT tokens shall be used for all authenticated API requests | Must | — |
| FR-AUTH-007 | JWT access tokens shall expire after 24 hours | Must | — |
| FR-AUTH-008 | Refresh tokens shall allow silent token renewal without re-login (7 day expiry) | Should | — |
| FR-AUTH-009 | The system shall support graceful logout (token invalidation client-side) | Must | — |

---

## FR-USER — Registered User Features

| ID | Requirement | Priority | Role |
|---|---|---|---|
| FR-USER-001 | A registered user shall be able to submit one rating (1–5 stars) per location | Must | User |
| FR-USER-002 | A registered user shall be able to submit one review (text) per location | Must | User |
| FR-USER-003 | A registered user shall be able to edit or delete their own review | Must | User |
| FR-USER-004 | A registered user shall be able to flag a review as inappropriate | Should | User |
| FR-USER-005 | A registered user shall be able to add or remove a location from their favorites | Must | User |
| FR-USER-006 | A registered user shall be able to view their favorites list | Must | User |
| FR-USER-007 | A registered user shall be able to view their review history | Should | User |
| FR-USER-008 | A registered user shall be able to report a location for inaccurate information | Should | User |
| FR-USER-009 | A registered user shall be able to suggest a new location for Admin review | Should | User |

---

## FR-ADMIN — Admin Dashboard & CRUD

| ID | Requirement | Priority | Role |
|---|---|---|---|
| FR-ADMIN-001 | The Admin Dashboard shall be accessible only to users with role = ADMIN | Must | Admin |
| FR-ADMIN-002 | The admin shall be able to create a new location using a form with a map-based coordinate picker | Must | Admin |
| FR-ADMIN-003 | The admin shall be able to view all locations regardless of status (pending/approved/rejected/deleted) | Must | Admin |
| FR-ADMIN-004 | The admin shall be able to edit any field of any location | Must | Admin |
| FR-ADMIN-005 | The admin shall be able to soft-delete a location (status = deleted, not physically removed) | Must | Admin |
| FR-ADMIN-006 | The admin shall be able to hard-delete a location after soft deletion | Should | Admin |
| FR-ADMIN-007 | The admin shall be able to review imported (pending) locations and approve or reject them | Must | Admin |
| FR-ADMIN-008 | The admin shall be able to bulk-approve multiple pending locations at once | Should | Admin |
| FR-ADMIN-009 | The admin shall be able to create, edit, and delete categories | Must | Admin |
| FR-ADMIN-010 | The admin shall be able to view all user reviews and hide or delete any review | Must | Admin |
| FR-ADMIN-011 | The admin shall be able to view and act on inaccuracy reports (resolve or dismiss) | Should | Admin |
| FR-ADMIN-012 | The admin shall be able to view and act on user-submitted location suggestions | Should | Admin |
| FR-ADMIN-013 | The admin shall be able to view a paginated audit log of all admin actions | Should | Admin |
| FR-ADMIN-014 | The admin dashboard shall display a statistics overview: total locations, pending count, new users this week | Should | Admin |
| FR-ADMIN-015 | Every admin write action (create, update, delete, approve, reject) shall be recorded in the audit log | Must | Admin |

---

## FR-DATA — Data Import

| ID | Requirement | Priority | Role |
|---|---|---|---|
| FR-DATA-001 | A one-time import script shall parse Geofabrik OSM data for Ankara (all 25 districts) | Must | — |
| FR-DATA-002 | The import script shall map OSM amenity tags to internal categories | Must | — |
| FR-DATA-003 | Imported locations shall be stored with status = pending until admin-approved | Must | — |
| FR-DATA-004 | The import shall be idempotent — re-running shall not create duplicate records (deduplication by osm_id) | Must | — |
| FR-DATA-005 | The import script shall validate that coordinates fall within the Ankara bounding box | Must | — |
| FR-DATA-006 | The import script shall store both English and Turkish names where available in OSM data | Should | — |

---

## Priority Levels

| Level | Meaning |
|---|---|
| **Must** | Required for Phase 1. The project is incomplete without it. |
| **Should** | Highly desirable. Implement if possible in Phase 1. |
| **Could** | Nice to have. Phase 2 if not included in Phase 1. |
| **Won't** | Explicitly out of scope. |

---

*Document owner: Project team*
*Last updated: 2026-08-13*
