# AnchorMap — Ankara City GIS

> An interactive, professional-grade Geographic Information System (GIS) for Ankara, Turkey.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org)
[![PostGIS](https://img.shields.io/badge/PostGIS-3-orange.svg)](https://postgis.net)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)

---

## What Is AnchorMap?

AnchorMap is an interactive city guide for Ankara, Turkey. It provides:

- 🗺️ **Real geographic data** — 1,000+ locations across all 25 Ankara districts
- 🏥 **Multiple categories** — Healthcare, Education, Emergency, Public Services, Historical, Tourism
- 🔍 **Smart search** — Full-text search in English and Turkish
- 📍 **Spatial queries** — Find nearby locations within any radius
- ⭐ **User reviews** — Ratings and comments from registered users
- 🔐 **Admin dashboard** — Full CRUD management of geographic data
- 🐳 **Docker-ready** — One command to run the entire application

---

## Quick Start

```bash
git clone <repository-url>
cd ankara-gis
cp .env.example .env.docker
# Edit .env.docker with your credentials
make up
```

Visit: http://localhost:3000

---

## Architecture

```
Next.js Frontend → Express.js Backend → PostgreSQL + PostGIS (Supabase)
                                      → Cloudinary (Images)
Map tiles: OpenStreetMap (free, no API key)
```

---

## Documentation

📚 **Start here:** [`docs/START-HERE.md`](docs/START-HERE.md)

| Section | Description |
|---|---|
| [Product Vision](docs/00-product/01-vision.md) | What we're building and why |
| [System Architecture](docs/10-architecture/01-system-architecture.md) | High-level design |
| [GIS Architecture](docs/10-architecture/04-gis-architecture.md) | PostGIS and spatial queries |
| [Database Schema](docs/40-data/01-database-schema.md) | All tables and indexes |
| [API Reference](docs/30-contracts/01-api-overview.md) | REST API endpoints |
| [Local Development](docs/70-operations/01-local-development.md) | Setup guide |
| [Docker](docs/70-operations/02-docker.md) | Container configuration |
| [Security](docs/60-security/01-security-architecture.md) | Auth, RBAC, validation |
| [ADRs](docs/80-adr/) | Architecture Decision Records |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL 15 + PostGIS 3 |
| ORM | Prisma |
| Map | Leaflet.js + OpenStreetMap |
| Auth | JWT + Google OAuth |
| Images | Cloudinary CDN |
| Deployment | Vercel (frontend) + Railway (backend) + Supabase (database) |

---

## University Context

**Course:** GitHub & Vibe Coding Training — Work Experience
**Institution:** Ostim Technical University
**Instructor:** Kürşat Enes Selçuk Yücel
**Project:** Second project — GIS application with geographic CRUD operations

---

*Data sourced from OpenStreetMap contributors under the ODbL license.*
