// Integration helper for the current raw-pg seed convention.
// Pass the same pg Client/PoolClient used by database/prisma/seed/development.ts.
// Products upsert by CITEXT slug; RETURNING id keeps existing UUIDs.
// Variants are matched by product_id + "Standard sourcing" so repeats do not duplicate.

import { faker } from "@faker-js/faker";

import {
  EXPANDED_CATALOGUE_CATEGORIES,
  EXPANDED_CATALOGUE_PRODUCTS,
  type ExpandedCatalogueProduct,
} from "./expanded-catalogue.js";

type QueryResult<T> = { rows: T[] };
type Queryable = {
  query<T = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
};

const TARGET_CATEGORY_SLUGS = [
  "iphones-gadgets",
  "medical-equipments",
  "home-garden-wares",
  "machineries",
  "general-procurement",
  "home-appliances",
  "office-business",
  "fashion-textiles",
  "beauty-spa-salon",
  "retail-store-setup",
] as const;

const PRODUCT_CHUNK = 200;

const CATEGORY_CONTEXT: Record<string, readonly [string, string, string]> = {
  "iphones-gadgets": [
    "personal, business and education technology programmes",
    "connectivity, computing and digital operations",
    "office, classroom and field technology deployments",
  ],
  "medical-equipments": [
    "clinics, laboratories and healthcare facilities",
    "patient-care, diagnostic-support and laboratory work",
    "facility, ward and laboratory procurement programmes",
  ],
  "home-garden-wares": [
    "homes, gardens and commercial facilities",
    "fit-out, grounds and housekeeping programmes",
    "residential and facility-support projects",
  ],
  machineries: [
    "workshops, factories and construction sites",
    "processing, fabrication and industrial operations",
    "plant, site and workshop equipment programmes",
  ],
  "general-procurement": [
    "cross-category projects and custom sourcing briefs",
    "operations, events and facilities that span several categories",
    "bulk supplies and specification-led sourcing",
  ],
  "home-appliances": [
    "household, staff housing and light-commercial living spaces",
    "kitchens, laundry rooms and climate-controlled interiors",
    "residential and hospitality living equipment programmes",
  ],
  "office-business": [
    "offices, retail counters and commercial workplaces",
    "document handling, POS and workplace technology",
    "professional interiors and business operations",
  ],
  "fashion-textiles": [
    "apparel, uniforms and textile programmes",
    "retail, workwear and organisational clothing supply",
    "fabric, garment and accessory procurement",
  ],
  "beauty-spa-salon": [
    "salons, spas and beauty workspaces",
    "hair, nail and treatment-room equipment programmes",
    "professional beauty-business fit-out",
  ],
  "retail-store-setup": [
    "stores, showrooms and merchandising programmes",
    "checkout, display and stockroom fit-out",
    "retail expansion and store setup projects",
  ],
};

export function publishedCatalogueDescription(
  product: ExpandedCatalogueProduct,
  index: number,
): string {
  const context =
    CATEGORY_CONTEXT[product.categorySlug]?.[index % 3] ??
    "specification-led procurement";
  const fields = product.typicalSpecs.join(", ");
  const templates = [
    `${product.name} is sourced for ${context}. Specify ${fields}, quantity and delivery destination. This listing supports procurement and does not confirm warehouse stock.`,
    `Buyers request ${product.name} for ${context}. Include ${fields} on the request, with quantity and destination. Catalogue availability is for sourcing, not a stocked-inventory claim.`,
    `${product.name} can be procured for ${context}. Provide ${fields} plus quantity and destination so sourcing can proceed. Almahbub lists this as a procurement type, not confirmed warehouse stock.`,
  ];
  const base = templates[index % 3]!;
  const extras: string[] = [];
  if (/point-of-sale/i.test(product.name) && !/\bPOS\b/.test(base)) {
    extras.push("Buyers often search this as a POS terminal.");
  }
  if (
    /salon/i.test(product.name) &&
    /chair/i.test(product.name) &&
    !/salon chair/i.test(base)
  ) {
    extras.push("This is a salon chair for professional styling or reception seating.");
  }
  return extras.length > 0 ? `${base} ${extras.join(" ")}` : base;
}

export function assertExpandedCatalogueQuality(): void {
  if (EXPANDED_CATALOGUE_CATEGORIES.length !== 10) {
    throw new Error("Expanded catalogue must contain exactly 10 categories.");
  }
  if (EXPANDED_CATALOGUE_PRODUCTS.length !== 1000) {
    throw new Error("Expanded catalogue must contain exactly 1,000 products.");
  }

  const categorySlugs = EXPANDED_CATALOGUE_CATEGORIES.map((row) => row.slug);
  if (new Set(categorySlugs).size !== 10) {
    throw new Error("Expanded catalogue category slugs must be unique.");
  }
  for (const slug of TARGET_CATEGORY_SLUGS) {
    if (!categorySlugs.includes(slug)) {
      throw new Error(`Expanded catalogue is missing required category slug ${slug}.`);
    }
  }

  const counts = new Map<string, number>();
  const slugs = new Set<string>();
  for (const product of EXPANDED_CATALOGUE_PRODUCTS) {
    if (product.name.length < 1 || product.name.length > 200) {
      throw new Error(`Invalid product name length for ${product.slug}.`);
    }
    if (product.slug.length < 1 || product.slug.length > 200) {
      throw new Error(`Invalid product slug length for ${product.slug}.`);
    }
    if ((product.description?.length ?? 0) > 8000) {
      throw new Error(`Product description exceeds 8000 characters: ${product.slug}.`);
    }
    if (product.status !== "published") {
      throw new Error(`Expanded catalogue product ${product.slug} must be published.`);
    }
    if (product.sourcingStatus !== "available_for_procurement") {
      throw new Error(`Invalid sourcingStatus for ${product.slug}.`);
    }
    if (!product.unit.trim()) {
      throw new Error(`Missing unit for ${product.slug}.`);
    }
    if (!Array.isArray(product.typicalSpecs) || product.typicalSpecs.length === 0) {
      throw new Error(`Missing typicalSpecs for ${product.slug}.`);
    }
    if (slugs.has(product.slug)) {
      throw new Error(`Duplicate expanded product slug ${product.slug}.`);
    }
    slugs.add(product.slug);
    counts.set(product.categorySlug, (counts.get(product.categorySlug) ?? 0) + 1);
  }

  for (const slug of TARGET_CATEGORY_SLUGS) {
    if (counts.get(slug) !== 100) {
      throw new Error(
        `Expanded catalogue must contain exactly 100 products for ${slug}.`,
      );
    }
  }
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

export async function seedExpandedProcurementCatalogue(db: Queryable) {
  assertExpandedCatalogueQuality();

  const categoryIds: string[] = [];
  const categoryNames: string[] = [];
  const categorySlugs: string[] = [];
  const categoryStatuses: string[] = [];
  const categoryDescriptions: string[] = [];
  for (const category of EXPANDED_CATALOGUE_CATEGORIES) {
    categoryIds.push(category.id);
    categoryNames.push(category.name);
    categorySlugs.push(category.slug);
    categoryStatuses.push(category.status);
    categoryDescriptions.push(category.description);
  }

  await db.query(
    `
    INSERT INTO product_categories
      (id, name, slug, status, description, created_at, updated_at)
    SELECT
      t.id,
      t.name,
      t.slug,
      t.status::"ProductStatus",
      t.description,
      now(),
      now()
    FROM UNNEST(
      $1::uuid[],
      $2::text[],
      $3::citext[],
      $4::text[],
      $5::text[]
    ) AS t(id, name, slug, status, description)
    ON CONFLICT (slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      status = EXCLUDED.status,
      description = EXCLUDED.description,
      updated_at = NOW()
    `,
    [categoryIds, categoryNames, categorySlugs, categoryStatuses, categoryDescriptions],
  );

  const categoryRows = await db.query<{ id: string; slug: string }>(
    `SELECT id::text AS id, slug::text AS slug FROM product_categories`,
  );
  const categoryBySlug = new Map(
    categoryRows.rows.map((row) => [row.slug.toLowerCase(), row.id]),
  );

  const productChunks = chunk(
    EXPANDED_CATALOGUE_PRODUCTS.map((product, index) => ({
      product,
      index,
    })),
    PRODUCT_CHUNK,
  );

  for (const group of productChunks) {
    const insertIds = group.map(() => faker.string.uuid({ version: "7" }));
    const productCategoryIds = group.map(({ product }) => {
      const categoryId = categoryBySlug.get(product.categorySlug.toLowerCase());
      if (!categoryId) {
        throw new Error(`Missing category for catalogue slug: ${product.categorySlug}`);
      }
      return categoryId;
    });
    const names = group.map(({ product }) => product.name);
    const slugs = group.map(({ product }) => product.slug);
    const descriptions = group.map(({ product, index }) =>
      publishedCatalogueDescription(product, index),
    );
    const statuses = group.map(({ product }) => product.status);

    const upserted = await db.query<{ id: string; slug: string }>(
      `
      INSERT INTO products
        (id, category_id, name, slug, description, status, created_at, updated_at)
      SELECT
        t.id,
        t.category_id,
        t.name,
        t.slug,
        t.description,
        t.status::"ProductStatus",
        now(),
        now()
      FROM UNNEST(
        $1::uuid[],
        $2::uuid[],
        $3::text[],
        $4::citext[],
        $5::text[],
        $6::text[]
      ) AS t(id, category_id, name, slug, description, status)
      ON CONFLICT (slug)
      DO UPDATE SET
        category_id = EXCLUDED.category_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id::text AS id, slug::text AS slug
      `,
      [insertIds, productCategoryIds, names, slugs, descriptions, statuses],
    );

    const idBySlug = new Map(upserted.rows.map((row) => [row.slug.toLowerCase(), row.id]));
    const productIds = group.map(({ product }) => {
      const productId = idBySlug.get(product.slug.toLowerCase());
      if (!productId) {
        throw new Error(`Product upsert did not return an id for ${product.slug}`);
      }
      return productId;
    });

    const existingVariants = await db.query<{ id: string; product_id: string }>(
      `
      SELECT DISTINCT ON (product_id)
        id::text AS id,
        product_id::text AS product_id
      FROM product_variants
      WHERE product_id = ANY($1::uuid[])
        AND name = 'Standard sourcing'
      ORDER BY product_id, created_at ASC
      `,
      [productIds],
    );
    const variantIdByProduct = new Map(
      existingVariants.rows.map((row) => [row.product_id, row.id]),
    );

    const updateIds: string[] = [];
    const updateSpecs: string[] = [];
    const insertVariantIds: string[] = [];
    const insertProductIds: string[] = [];
    const insertSpecs: string[] = [];

    group.forEach(({ product }, offset) => {
      const productId = productIds[offset]!;
      const specifications = JSON.stringify({
        unit: product.unit,
        typicalSpecificationFields: product.typicalSpecs,
        sourcingStatus: product.sourcingStatus,
      });
      const existingId = variantIdByProduct.get(productId);
      if (existingId) {
        updateIds.push(existingId);
        updateSpecs.push(specifications);
      } else {
        insertVariantIds.push(faker.string.uuid({ version: "7" }));
        insertProductIds.push(productId);
        insertSpecs.push(specifications);
      }
    });

    if (updateIds.length > 0) {
      await db.query(
        `
        UPDATE product_variants AS v
        SET specifications = u.spec::jsonb,
            updated_at = NOW()
        FROM UNNEST($1::uuid[], $2::text[]) AS u(id, spec)
        WHERE v.id = u.id
        `,
        [updateIds, updateSpecs],
      );
    }

    if (insertVariantIds.length > 0) {
      await db.query(
        `
        INSERT INTO product_variants
          (id, product_id, name, specifications, created_at, updated_at)
        SELECT
          t.id,
          t.product_id,
          'Standard sourcing',
          t.spec::jsonb,
          now(),
          now()
        FROM UNNEST($1::uuid[], $2::uuid[], $3::text[]) AS t(id, product_id, spec)
        `,
        [insertVariantIds, insertProductIds, insertSpecs],
      );
    }
  }
}
