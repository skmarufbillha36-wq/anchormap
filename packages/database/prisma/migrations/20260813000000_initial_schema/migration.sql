-- CreateExtensions (must run before any table creation)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- CreateTable users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "provider" TEXT NOT NULL DEFAULT 'email',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateTable categories
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "name_tr" TEXT,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "parent_id" UUID,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable locations (with PostGIS geometry column)
CREATE TABLE "locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "osm_id" BIGINT,
    "osm_type" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_tr" TEXT,
    "category_id" UUID NOT NULL,
    "subcategory" TEXT,
    "geom" geometry(Point,4326),
    "district" TEXT,
    "address" TEXT,
    "description" TEXT,
    "description_tr" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "hours_json" JSONB,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "accessibility" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL DEFAULT 'osm',
    "avg_rating" DECIMAL(3,2),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "locations_osm_id_key" ON "locations"("osm_id");
CREATE UNIQUE INDEX "locations_slug_key" ON "locations"("slug");

-- Spatial index (GIST) — the most important index for performance
CREATE INDEX "locations_geom_gist" ON "locations" USING GIST("geom");

-- Composite indexes for common queries
CREATE INDEX "locations_status_idx" ON "locations"("status");
CREATE INDEX "locations_category_status_idx" ON "locations"("category_id", "status");
CREATE INDEX "locations_district_idx" ON "locations"("district");

-- Full-text search indexes (English + Turkish)
CREATE INDEX "locations_fts_en" ON "locations"
  USING GIN(to_tsvector('english', "name" || ' ' || COALESCE("description", '')));
CREATE INDEX "locations_fts_tr" ON "locations"
  USING GIN(to_tsvector('turkish', COALESCE("name_tr", "name") || ' ' || COALESCE("description_tr", '')));

-- Trigram indexes for partial search
CREATE INDEX "locations_name_trgm" ON "locations" USING GIN("name" gin_trgm_ops);
CREATE INDEX "locations_name_tr_trgm" ON "locations" USING GIN("name_tr" gin_trgm_ops);

ALTER TABLE "locations" ADD CONSTRAINT "locations_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "locations" ADD CONSTRAINT "locations_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable photos
CREATE TABLE "photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "location_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "caption" TEXT,
    "caption_tr" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "photos_location_idx" ON "photos"("location_id");

ALTER TABLE "photos" ADD CONSTRAINT "photos_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_fkey"
  FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable reviews
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "location_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "flag_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reviews_location_user_key" ON "reviews"("location_id", "user_id");
CREATE INDEX "reviews_location_idx" ON "reviews"("location_id");
CREATE INDEX "reviews_user_idx" ON "reviews"("user_id");
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable favorites
CREATE TABLE "favorites" (
    "user_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","location_id")
);

CREATE INDEX "favorites_user_idx" ON "favorites"("user_id");

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable reports
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "location_id" UUID NOT NULL,
    "reporter_id" UUID,
    "type" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reports_location_idx" ON "reports"("location_id");
CREATE INDEX "reports_status_idx" ON "reports"("status");

ALTER TABLE "reports" ADD CONSTRAINT "reports_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey"
  FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_fkey"
  FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable suggestions
CREATE TABLE "suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "suggested_by" UUID,
    "name" TEXT NOT NULL,
    "name_tr" TEXT,
    "category_id" UUID,
    "lat" DECIMAL(10,7) NOT NULL,
    "lng" DECIMAL(10,7) NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "location_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_suggested_by_fkey"
  FOREIGN KEY ("suggested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable audit_log
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "changes_json" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_log_entity_idx" ON "audit_log"("entity_type", "entity_id");
CREATE INDEX "audit_log_user_idx" ON "audit_log"("user_id");
CREATE INDEX "audit_log_created_idx" ON "audit_log"("created_at" DESC);

ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
