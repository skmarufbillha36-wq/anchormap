# Product Vision

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0
**Status:** Pre-implementation (documentation phase)

---

## Problem Statement

People living in, moving to, or visiting Ankara, Turkey face a fragmented information landscape.
Finding reliable, categorized, geographically organized information about the city requires navigating
between multiple unrelated government websites, outdated tourist guides, and generic map applications
that are not tailored to Ankara's specific structure.

There is no single, authoritative, interactive geographic guide for Ankara that combines:
- Public services (healthcare, education, emergency, government)
- Historical and cultural significance
- Tourism and recreation
- Real geographic search capabilities (nearby, radius, district-based)

Existing tools such as Google Maps are generic. They are not organized around Ankara's categories,
do not provide district-level filtering, and do not expose the data through a manageable admin interface.

---

## Vision Statement

AnchorMap is a **professional-grade interactive GIS web application** that serves as the definitive
geographic guide to Ankara, Turkey.

It provides:
- An accurate, curated, regularly maintainable database of thousands of Ankara locations
- Real geographic queries (proximity, radius, district, category)
- A multilingual interface (English primary, Turkish secondary)
- A self-service Admin Dashboard with full geographic CRUD capabilities
- A public map experience suitable for visitors, residents, and tourists

The project demonstrates that a university-level GIS project can be built to real-world production
standards — with proper architecture, real data, real deployment, and real usability.

---

## Objectives

### Primary Objectives (Required)

1. **Satisfy the professor's requirement**: Build a working application that performs CRUD operations
   using geographic data.

2. **Real geographic database**: Import and maintain a meaningful dataset of Ankara locations
   (target: 1,000+ approved locations at launch) using OpenStreetMap data.

3. **Admin CRUD**: Build a fully functional, protected Admin Dashboard where an administrator
   can create, read, update, and delete geographic locations.

4. **Interactive map**: Display locations on a real, interactive map with marker clustering,
   category filtering, and location detail views.

5. **Public deployment**: Deploy the application to a publicly accessible URL on free-tier infrastructure.

### Secondary Objectives (Quality)

6. **Professional architecture**: Implement a clean, maintainable, documented codebase using
   patterns appropriate for a production application.

7. **User features**: Enable registered users to rate, review, and favorite locations.

8. **Geographic queries**: Implement real spatial queries (nearby, radius, district-based).

9. **Bilingual content**: Support both English and Turkish location names and content.

10. **Docker**: Provide a reproducible Docker-based development and deployment environment.

### Stretch Objectives (Phase 2+)

11. Tourist circuit planner
12. Transit layer (Ankara EGO/EGO bus stops, metro stations)
13. Camera POI feature (professor's optional feature)
14. Open Now filtering using structured hours data

---

## Success Criteria

The project is considered **complete for Phase 1** when all of the following are true:

- [ ] At least 1,000 approved, geographically accurate Ankara locations in the database
- [ ] All 6 main categories populated with real data
- [ ] All 25 Ankara districts represented with data
- [ ] A visitor can: view map, search, filter by category, view location details, find nearby places
- [ ] A registered user can: rate, review, and favorite locations
- [ ] An admin can: create, edit, delete, and approve locations via the dashboard
- [ ] The application is live at a public URL
- [ ] HTTPS is enforced
- [ ] The application is mobile-responsive
- [ ] Docker setup works: `docker compose up --build` produces a running application
- [ ] No critical security vulnerabilities (no exposed secrets, no SQL injection vectors)

---

## Non-Goals (What This Project Is NOT)

- **Not a navigation app**: We do not provide turn-by-turn directions (Phase 2+ only).
- **Not a real-time app**: We do not use WebSockets or live data updates.
- **Not a social network**: Users cannot follow each other or share custom lists.
- **Not a mobile app**: This is a web application. Mobile-responsive, not a native app.
- **Not a paid service**: This is a free, public resource. No payments or subscriptions.
- **Not a government system**: This is not affiliated with the Ankara municipality.

---

*Document owner: Project team*
*Last updated: 2026-08-13*
