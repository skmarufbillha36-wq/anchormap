# Frontend Architecture

**Project:** AnchorMap — Ankara City GIS
**Version:** 1.0

---

## Overview

The frontend is a **Next.js 14** application using the App Router, TypeScript, and Tailwind CSS.
It communicates exclusively with the Express backend via REST API — it has no direct
database access.

The most important frontend constraint is: **Leaflet.js cannot be rendered server-side**.
It requires the browser's `window` object. All map components must be loaded with
`dynamic(() => import(...), { ssr: false })`.

---

## Directory Structure

```
apps/web/
├── src/
│   ├── app/                         ← Next.js App Router root
│   │   ├── layout.tsx               ← Root layout (fonts, global CSS, providers)
│   │   ├── globals.css              ← Design system (CSS custom properties)
│   │   │
│   │   ├── (public)/                ← Route group: public pages (no auth required)
│   │   │   ├── page.tsx             ← / (Home — full-screen map)
│   │   │   ├── locations/
│   │   │   │   ├── page.tsx         ← /locations (browsable list)
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx     ← /locations/[slug] (detail page — SSR)
│   │   │   ├── categories/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx     ← /categories/[slug]
│   │   │   ├── search/
│   │   │   │   └── page.tsx         ← /search?q=... (search results)
│   │   │   └── emergency/
│   │   │       └── page.tsx         ← /emergency (quick access panel)
│   │   │
│   │   ├── (auth)/                  ← Route group: authentication pages
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── (user)/                  ← Route group: authenticated user pages
│   │   │   └── profile/
│   │   │       ├── page.tsx         ← /profile
│   │   │       ├── favorites/
│   │   │       │   └── page.tsx     ← /profile/favorites
│   │   │       └── reviews/
│   │   │           └── page.tsx     ← /profile/reviews
│   │   │
│   │   └── admin/                   ← Admin dashboard (server-enforced auth guard)
│   │       ├── layout.tsx           ← Admin layout with sidebar nav
│   │       ├── page.tsx             ← /admin (dashboard home)
│   │       ├── locations/
│   │       │   ├── page.tsx         ← Locations table
│   │       │   ├── new/page.tsx     ← Create location
│   │       │   └── [id]/page.tsx    ← Edit location
│   │       ├── import/page.tsx      ← Import queue
│   │       ├── categories/page.tsx
│   │       ├── reviews/page.tsx
│   │       ├── reports/page.tsx
│   │       ├── suggestions/page.tsx
│   │       ├── users/page.tsx
│   │       └── audit-log/page.tsx
│   │
│   ├── components/
│   │   ├── map/                     ← All map components (client-only)
│   │   │   ├── MapContainer.tsx     ← Dynamic import wrapper (ssr: false)
│   │   │   ├── Map.tsx              ← Core Leaflet map initialization
│   │   │   ├── MarkerLayer.tsx      ← Renders location markers
│   │   │   ├── ClusterLayer.tsx     ← Leaflet.markercluster integration
│   │   │   ├── LocationPopup.tsx    ← Marker click popup
│   │   │   └── DistrictOverlay.tsx  ← GeoJSON district boundaries
│   │   │
│   │   ├── location/
│   │   │   ├── LocationCard.tsx     ← Card for list views
│   │   │   ├── LocationDetailPanel.tsx  ← Sidebar panel (map view)
│   │   │   ├── LocationDetailPage.tsx   ← Full page detail
│   │   │   ├── PhotoGallery.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   ├── ReviewForm.tsx
│   │   │   ├── StarRating.tsx
│   │   │   ├── NearbyList.tsx
│   │   │   ├── OpenHoursDisplay.tsx
│   │   │   └── CategoryBadge.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── LocationTable.tsx
│   │   │   ├── LocationForm.tsx
│   │   │   ├── CoordinatePicker.tsx ← Mini Leaflet map for coordinate input
│   │   │   ├── ImportQueue.tsx
│   │   │   ├── CategoryForm.tsx
│   │   │   └── AuditLogTable.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx          ← Map filter sidebar
│   │   │   └── AdminSidebar.tsx
│   │   │
│   │   └── ui/                      ← Generic UI primitives
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── Skeleton.tsx
│   │       ├── Badge.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── store/
│   │   ├── authStore.ts             ← Zustand: user, token, login/logout
│   │   └── mapStore.ts              ← Zustand: active filters, selected location
│   │
│   ├── lib/
│   │   ├── api.ts                   ← Axios instance with JWT interceptor
│   │   ├── formatters.ts            ← Date, distance, hours formatting
│   │   └── map-icons.ts             ← Leaflet icon definitions per category
│   │
│   └── middleware.ts                ← Next.js middleware: protect /admin routes
│
├── public/
│   ├── icons/                       ← SVG category icons for map markers
│   └── geodata/
│       └── ankara-districts.geojson ← District boundary polygons
│
├── Dockerfile
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Rendering Strategy

| Page | Render Mode | Reason |
|---|---|---|
| `/` (Map home) | CSR | Map requires browser APIs |
| `/locations` | SSR | SEO-indexable list |
| `/locations/[slug]` | SSR | SEO-critical: individual location pages |
| `/categories/[slug]` | SSR | SEO-indexable category page |
| `/search` | CSR | Highly dynamic, filter-driven |
| `/emergency` | SSR | Simple, static-ish emergency panel |
| `/profile/*` | CSR | Requires auth, not SEO-relevant |
| `/admin/*` | CSR | Not public, requires auth |

---

## Critical: Leaflet SSR Handling

Leaflet and Leaflet.markercluster require the browser's `window` object and cannot
be imported or rendered server-side. All map components must be wrapped with Next.js
dynamic import using `ssr: false`.

```typescript
// MapContainer.tsx — the ONLY way to import map components
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), { ssr: false });

export default function MapContainer() {
  return <Map />;
}
```

**Never** import Leaflet at the top level of a file that could be server-rendered.
Any violation causes a `ReferenceError: window is not defined` at build/runtime.

---

## State Management (Zustand)

Two stores cover all global state needs:

### authStore
```typescript
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

- Token persisted to localStorage (rehydrated on app load)
- Axios interceptor reads token from store for all requests
- 401 response interceptor → clears store → redirects to `/login`

### mapStore
```typescript
interface MapState {
  activeFilters: {
    categories: string[];
    district: string | null;
    openNow: boolean;
    search: string;
  };
  selectedLocationId: string | null;
  viewport: BoundingBox | null;
  setFilters: (filters: Partial<ActiveFilters>) => void;
  setSelectedLocation: (id: string | null) => void;
  setViewport: (bbox: BoundingBox) => void;
}
```

---

## API Client

```typescript
// lib/api.ts — Single Axios instance used across the entire frontend
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// JWT injection
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 handler
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Admin Route Protection

Admin pages are protected at two levels:

**Level 1: Next.js Middleware** (`middleware.ts`)
```typescript
// Runs on every request to /admin/*
// If no token → redirect to /login
// If token but role !== ADMIN → redirect to /
```

**Level 2: API-level enforcement**
All admin API endpoints on the backend independently verify `role === ADMIN`.
Frontend protection is a UX convenience; backend protection is the security boundary.

---

## Design System

All design tokens are defined as CSS custom properties in `globals.css`:

```css
:root {
  --color-primary: #2563eb;       /* Ankara blue */
  --color-primary-dark: #1d4ed8;
  --color-accent: #dc2626;        /* Emergency red */
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-surface: #ffffff;
  --color-background: #f1f5f9;
  --color-text: #1e293b;
  --color-text-muted: #64748b;

  --font-display: 'Inter', sans-serif;  /* Turkish character support */
  --radius-card: 12px;
  --radius-button: 8px;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-panel: 0 4px 16px rgba(0,0,0,0.15);
}
```

---

## Map Icons

Each category has a custom SVG icon and color used for Leaflet markers.

```typescript
// lib/map-icons.ts
export const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  education:     { icon: 'graduation-cap', color: '#3b82f6' },  // blue
  healthcare:    { icon: 'heart-pulse',    color: '#ef4444' },  // red
  emergency:     { icon: 'siren',          color: '#f97316' },  // orange
  'public-services': { icon: 'building',  color: '#8b5cf6' },  // purple
  historical:    { icon: 'landmark',       color: '#d97706' },  // amber
  tourism:       { icon: 'camera',         color: '#10b981' },  // green
};
```

---

*Document owner: Project team*
*Last updated: 2026-08-13*
