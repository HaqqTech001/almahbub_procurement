-- Master catalogue metadata support.
-- This migration is additive: existing products remain intact and receive safe
-- compatibility defaults. It does not archive, rename, or delete catalogue rows.

CREATE TYPE "CatalogueEntryType" AS ENUM (
  'STANDARD_PRODUCT',
  'PRODUCT_FAMILY',
  'PROCUREMENT_SERVICE',
  'CONFIGURABLE_PRODUCT'
);

CREATE TYPE "ProductAvailabilityStatus" AS ENUM (
  'ON_REQUEST',
  'COMING_SOON',
  'PRE_ORDER',
  'OUT_OF_STOCK'
);

ALTER TABLE "products"
  ADD COLUMN "catalogue_id" TEXT,
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "key_specifications" JSONB,
  ADD COLUMN "entry_type" "CatalogueEntryType" NOT NULL DEFAULT 'STANDARD_PRODUCT',
  ADD COLUMN "availability_status" "ProductAvailabilityStatus" NOT NULL DEFAULT 'ON_REQUEST',
  ADD COLUMN "manufacturer_url" TEXT,
  ADD COLUMN "verification_status" TEXT,
  ADD COLUMN "media_status" TEXT,
  ADD COLUMN "hero_image_policy" TEXT,
  ADD COLUMN "source_manifest_version" TEXT,
  ADD COLUMN "release_date" DATE,
  ADD COLUMN "catalogue_notes" TEXT;

CREATE UNIQUE INDEX "products_catalogue_id_key"
  ON "products"("catalogue_id");

CREATE INDEX "products_entry_type_status_idx"
  ON "products"("entry_type", "status");

CREATE INDEX "products_availability_status_status_idx"
  ON "products"("availability_status", "status");
