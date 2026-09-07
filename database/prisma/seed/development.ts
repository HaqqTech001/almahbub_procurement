import { faker } from "@faker-js/faker";
import pg from "pg";

import { archiveLegacyDuplicateCatalogueProducts, LEGACY_DUPLICATE_ARCHIVE_SLUGS } from "./catalogue-cleanup.js";
import { EXPANDED_CATALOGUE_PRODUCTS } from "./expanded-catalogue.js";
import { upsertIeOwnerApprovedCommodityDrafts } from "./ie-owner-approved-commodity-drafts.js";
import { unpublishAllIeCommodities } from "./ie-publish-commodities.js";
import {
  assertProcurementCatalogueQuality,
  PROCUREMENT_CATALOGUE_CATEGORIES,
  PROCUREMENT_CATALOGUE_PRODUCTS,
} from "./procurement-catalogue.js";
import { seedExpandedProcurementCatalogue } from "./seed-expanded-catalogue.js";

const databaseUrl = process.env.MIGRATION_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("MIGRATION_DATABASE_URL is required to seed the database.");
}

const pool = new pg.Pool({ connectionString: databaseUrl });

const permissions = [
  ["request:read", "request", "read"],
  ["request:create", "request", "create"],
  ["request:update", "request", "update"],
  ["request:submit", "request", "submit"],
  ["request:cancel", "request", "cancel"],
  ["request:archive", "request", "archive"],
  ["request:restore", "request", "restore"],
  ["request:duplicate", "request", "duplicate"],
  ["request:assign", "request", "assign"],
  ["request:manage", "request", "manage"],
  ["quotation:read", "quotation", "read"],
  ["quotation:create", "quotation", "create"],
  ["quotation:update", "quotation", "update"],
  ["quotation:review", "quotation", "review"],
  ["quotation:issue", "quotation", "issue"],
  ["quotation:approve", "quotation", "approve"],
  ["quotation:revise", "quotation", "revise"],
  ["invoice:read", "invoice", "read"],
  ["invoice:create", "invoice", "create"],
  ["invoice:update", "invoice", "update"],
  ["invoice:issue", "invoice", "issue"],
  ["invoice:void", "invoice", "void"],
  ["payment:read", "payment", "read"],
  ["payment:create", "payment", "create"],
  ["payment:submit", "payment", "submit"],
  ["payment:confirm", "payment", "confirm"],
  ["shipment:read", "shipment", "read"],
  ["shipment:create", "shipment", "create"],
  ["shipment:update", "shipment", "update"],
  ["shipment:manage", "shipment", "manage"],
  ["shipment:confirm", "shipment", "confirm"],
  ["notification:read", "notification", "read"],
  ["notification:manage", "notification", "manage"],
  ["communication:manage", "communication", "manage"],
  ["communication:publish", "communication", "publish"],
  ["guidance:read", "guidance", "read"],
  ["guidance:manage", "guidance", "manage"],
  ["ops:access", "ops", "access"],
  ["audit:read", "audit", "read"],
  ["ai:use", "ai", "use"],
  ["cms:manage", "cms", "manage"],
] as const;

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const [key, resource, action] of permissions) {
      await client.query(
        `INSERT INTO permissions (id, key, resource, action, created_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (key) DO NOTHING`,
        [faker.string.uuid({ version: "7" }), key, resource, action],
      );
    }

    assertProcurementCatalogueQuality();

    for (const category of PROCUREMENT_CATALOGUE_CATEGORIES) {
      await client.query(
        `INSERT INTO product_categories (id, name, slug, status, description, created_at, updated_at)
         VALUES ($1, $2, $3, 'published', $4, now(), now())
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           status = 'published'`,
        [category.id, category.name, category.slug, category.description],
      );
    }

    const categoryIds = new Map<string, string>();
    const categoryRows = await client.query<{ id: string; slug: string }>(
      `SELECT id, slug FROM product_categories WHERE slug = ANY($1::citext[])`,
      [PROCUREMENT_CATALOGUE_CATEGORIES.map((row) => row.slug)],
    );
    for (const row of categoryRows.rows) {
      categoryIds.set(row.slug, row.id);
    }

    const generatedSlugs = new Set(
      EXPANDED_CATALOGUE_PRODUCTS.map((row) => row.slug),
    );
    const archiveSlugs = new Set<string>(LEGACY_DUPLICATE_ARCHIVE_SLUGS);

    const extras = PROCUREMENT_CATALOGUE_PRODUCTS.filter(
      (product) =>
        !generatedSlugs.has(product.slug) && !archiveSlugs.has(product.slug),
    );
    if (extras.length > 0) {
      const extraCategoryIds = extras.map((product) => {
        const categoryId = categoryIds.get(product.categorySlug);
        if (!categoryId) {
          throw new Error(`Missing category ${product.categorySlug}`);
        }
        return categoryId;
      });
      await client.query(
        `
        INSERT INTO products
          (id, category_id, name, slug, description, status, created_at, updated_at)
        SELECT
          t.id, t.category_id, t.name, t.slug, t.description, 'published', now(), now()
        FROM UNNEST(
          $1::uuid[], $2::uuid[], $3::text[], $4::citext[], $5::text[]
        ) AS t(id, category_id, name, slug, description)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          status = 'published'
        `,
        [
          extras.map((row) => row.id),
          extraCategoryIds,
          extras.map((row) => row.name),
          extras.map((row) => row.slug),
          extras.map((row) => row.description),
        ],
      );
      await client.query(
        `
        INSERT INTO product_variants
          (id, product_id, name, specifications, created_at, updated_at)
        SELECT
          t.id, t.product_id, 'Standard sourcing', t.spec::jsonb, now(), now()
        FROM UNNEST($1::uuid[], $2::uuid[], $3::text[]) AS t(id, product_id, spec)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          specifications = EXCLUDED.specifications
        `,
        [
          extras.map((row) => row.variantId),
          extras.map((row) => row.id),
          extras.map((row) =>
            JSON.stringify({
              unit: row.unit,
              typicalSpecificationFields: row.typicalSpecs,
              sourcingStatus: "available_for_procurement",
            }),
          ),
        ],
      );
    }

    await seedExpandedProcurementCatalogue(client);
    await archiveLegacyDuplicateCatalogueProducts(client);

    // Development fixture only - draft so it never appears on the public catalogue.
    await client.query(
      `INSERT INTO products (id, category_id, name, slug, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'draft', now(), now())
       ON CONFLICT (slug) DO UPDATE SET status = 'draft'`,
      [
        faker.string.uuid({ version: "7" }),
        "0190c8a0-1000-7000-8000-000000000005",
        `${faker.commerce.productAdjective()} Procurement Sample`,
        "procurement-sample",
      ],
    );

    const ieDrafts = await upsertIeOwnerApprovedCommodityDrafts(client);
    const ieUnpublished = await unpublishAllIeCommodities(client);

    await client.query("COMMIT");
    console.log(
      `Development reference data seeded. IE drafts inserted=${ieDrafts.inserted.join(",") || "(none)"} skipped=${ieDrafts.skipped.join(",") || "(none)"} unpublished=${ieUnpublished.unpublished}`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void seed();
