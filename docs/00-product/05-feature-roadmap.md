# Feature Roadmap

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Phase 1 — Core (Professor Submission)

**Goal:** Build a fully functional GIS application with geographic CRUD, real data, public deployment.

**Target:** University submission deadline.

### Infrastructure & Setup
- [ ] Monorepo initialization (npm workspaces)
- [ ] TypeScript configuration (shared tsconfig)
- [ ] Prettier + ESLint configuration
- [ ] Docker configuration (dev + prod)
- [ ] Supabase project setup (PostgreSQL + PostGIS)
- [ ] Cloudinary account setup

### Database
- [ ] Prisma schema (all tables)
- [ ] Database migrations
- [ ] PostGIS extension enablement
- [ ] Spatial indexes (GIST on geometry)
- [ ] Full-text search indexes (GIN)
- [ ] Seed categories (initial 6 parent categories)

### Data Import Pipeline
- [ ] Download Geofabrik Turkey OSM extract
- [ ] Filter to Ankara bounding box (all 25 districts)
- [ ] Import script: parse, map tags to categories, insert
- [ ] Import produces: 1,000+ pending locations
- [ ] Ankara district boundaries GeoJSON file

### Backend (Express API)
- [ ] Express app setup with middleware stack
- [ ] Zod-based environment validation
- [ ] Global error handler
- [ ] ApiError + ApiResponse utilities
- [ ] JWT auth (sign + verify)
- [ ] Auth routes (register, login, logout, me, refresh)
- [ ] Google OAuth (Passport.js)
- [ ] Location routes (CRUD + spatial queries)
- [ ] Category routes (CRUD)
- [ ] Review routes (CRUD + flag)
- [ ] Favorites routes
- [ ] Reports routes
- [ ] Suggestions routes
- [ ] Admin routes (locations, categories, reviews, reports, suggestions, users, audit-log)
- [ ] Cloudinary image upload route
- [ ] Health check endpoint

### Frontend (Next.js)
- [ ] Next.js 14 App Router setup
- [ ] Design system (Tailwind CSS + custom tokens)
- [ ] Shared API client (Axios + interceptors)
- [ ] Auth store (Zustand)
- [ ] Interactive map page (Leaflet, SSR-safe)
- [ ] Marker clustering layer
- [ ] Category-colored custom marker icons
- [ ] Location popup (click → sidebar panel)
- [ ] Location detail sidebar
- [ ] Location detail full page (`/locations/[slug]`)
- [ ] Category filter sidebar
- [ ] Search bar with debounce
- [ ] Nearby locations panel
- [ ] Emergency quick-panel
- [ ] District overlay toggle
- [ ] User auth pages (login, register, forgot-password)
- [ ] User profile page
- [ ] Favorites list page
- [ ] Review/rating form
- [ ] Location report form
- [ ] Location suggestion form
- [ ] Admin Dashboard layout
- [ ] Admin: Locations table (search, filter, sort, paginate)
- [ ] Admin: Location create form with coordinate picker
- [ ] Admin: Location edit form
- [ ] Admin: Import queue (pending locations)
- [ ] Admin: Category management
- [ ] Admin: Reviews moderation
- [ ] Admin: Reports queue
- [ ] Admin: Suggestions queue
- [ ] Admin: Audit log viewer

### Deployment
- [ ] Frontend: Deploy to Vercel
- [ ] Backend: Deploy to Railway or Render (Docker)
- [ ] Database: Supabase production instance
- [ ] Environment variables: all configured in target platforms
- [ ] HTTPS: confirmed on all endpoints
- [ ] Health checks: passing in production
- [ ] Public URL: accessible and tested

### Documentation
- [ ] All docs/* documents created
- [ ] README.md written
- [ ] Project documentation (equivalent of flower_shop_documentation.md)

---

## Phase 2 — Enhancements (Post-Submission)

**Goal:** Improve usability and add features that elevate the application beyond the assignment.

### Map Enhancements
- [ ] Heatmap density layer (POI concentration visualization)
- [ ] "Open Now" layer filter (show only currently open locations)
- [ ] Mapbox GL tiles option (more polished visual, requires API key)
- [ ] 3D building layer (if Mapbox is adopted)

### Data & Admin
- [ ] Admin: Import runner UI (trigger import from dashboard, not CLI)
- [ ] Admin: Bulk edit multiple locations
- [ ] Admin: Location merge (for near-duplicates)
- [ ] Data freshness badge (last reviewed date on location cards)
- [ ] OSM data refresh pipeline (periodic re-import with smart update strategy)

### User Experience
- [ ] Dark mode toggle
- [ ] Saved search filters (remember user's last filter state)
- [ ] Location comparison view (side by side)
- [ ] Print / export location card (PDF)

### SEO & Social
- [ ] Open Graph meta tags per location (`/locations/[slug]`)
- [ ] Twitter Card meta tags
- [ ] `sitemap.xml` generation
- [ ] `robots.txt`
- [ ] Structured data (JSON-LD: LocalBusiness schema)

### Transit Layer
- [ ] Ankara EGO bus stop data import (GTFS format)
- [ ] Bus stop markers on map (separate layer, toggleable)
- [ ] Metro station markers
- [ ] Show "Nearby Transit" in location detail

### Analytics
- [ ] Admin: Most-viewed locations
- [ ] Admin: Top-rated locations by category
- [ ] Admin: Search query analytics
- [ ] Admin: New user registrations trend

---

## Phase 3 — Stretch Goals

**Goal:** Differentiate the project with advanced GIS features.

### Camera POI Feature (Professor's Optional Feature)
- [ ] New `camera` category type
- [ ] Camera markers shown on map (special icon)
- [ ] Click → opens video panel (embedded YouTube live stream or public RTSP-to-HLS stream)
- [ ] Admin: manages camera locations and stream URLs

### Routing & Navigation
- [ ] Integration with OSRM (Open Source Routing Machine)
- [ ] "Get Directions" button on location detail
- [ ] Route displayed on map (walking / driving)
- [ ] Estimated travel time shown

### Advanced GIS
- [ ] Polygon support for large locations (university campuses, parks, districts)
- [ ] Line geometry support for streets, trails
- [ ] Drawing tool (admin can draw polygon instead of just placing a point)
- [ ] WMS/WFS layer support (official Turkish GIS data layers)

### Tourist Circuit
- [ ] Admin creates named tourist circuits (e.g., "Ankara Historical Walk")
- [ ] Circuit shown as a polyline with ordered stops
- [ ] User can "start" a circuit and track progress
- [ ] Shareable circuit link

---

## Definition of Done — Phase 1

A Phase 1 feature is "Done" when:
1. Implementation is complete
2. Works correctly in Docker local environment
3. Works correctly in production deployment
4. No TypeScript errors
5. Input validation is implemented
6. Error states are handled (not just happy path)
7. Loading states are implemented
8. Mobile-responsive
9. API endpoint is documented in `docs/30-contracts/`
10. Related domain documentation is updated if applicable

---

*Document owner: Project team*
*Last updated: 2026-08-13*
