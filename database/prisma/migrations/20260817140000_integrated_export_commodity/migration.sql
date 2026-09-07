-- IE-11A: Integrated Export commodity catalogue (empty — no seed rows).
-- Isolated from International products / product_categories.

CREATE TABLE "integrated_export_commodities" (
    "id" UUID NOT NULL,
    "slug" CITEXT NOT NULL,
    "name" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "short_description" TEXT,
    "description" TEXT,
    "hero_media" JSONB,
    "gallery" JSONB,
    "specifications" JSONB,
    "packaging" TEXT,
    "quality_information" TEXT,
    "applications" JSONB,
    "markets" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "integrated_export_commodities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integrated_export_commodities_slug_key"
ON "integrated_export_commodities"("slug");

CREATE INDEX "integrated_export_commodities_published_sort_order_idx"
ON "integrated_export_commodities"("published", "sort_order");

CREATE INDEX "integrated_export_commodities_archived_at_idx"
ON "integrated_export_commodities"("archived_at");
