// Integration helper for the current raw-pg seed convention.
// Pass the same pg Client/PoolClient used by database/prisma/seed/development.ts.
// It safely upserts products by CITEXT slug, obtains the actual database product UUID,
// then updates or creates the "Standard sourcing" ProductVariant for that real product ID.
//
// This intentionally avoids assigning new product IDs to pre-existing slugs because the
// current database already contains 127 seeded catalogue records with stable UUIDs.

import {
  EXPANDED_CATALOGUE_CATEGORIES,
  EXPANDED_CATALOGUE_PRODUCTS,
} from "./expanded-catalogue";

type QueryResult<T> = { rows: T[] };
type Queryable = {
  query<T = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
};

export async function seedExpandedProcurementCatalogue(db: Queryable) {
  for (const category of EXPANDED_CATALOGUE_CATEGORIES) {
    await db.query(
      `
      INSERT INTO product_categories
        (id, name, slug, status, description)
      VALUES
        ($1::uuid, $2, $3, $4::"ProductStatus", $5)
      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        description = EXCLUDED.description,
        updated_at = NOW()
      `,
      [
        category.id,
        category.name,
        category.slug,
        category.status,
        category.description,
      ],
    );
  }

  const categoryRows = await db.query<{ id: string; slug: string }>(
    `SELECT id::text AS id, slug::text AS slug FROM product_categories`,
  );
  const categoryBySlug = new Map(
    categoryRows.rows.map((row) => [row.slug.toLowerCase(), row.id]),
  );

  for (const product of EXPANDED_CATALOGUE_PRODUCTS) {
    const categoryId = categoryBySlug.get(product.categorySlug.toLowerCase());
    if (!categoryId) {
      throw new Error(`Missing category for catalogue slug: ${product.categorySlug}`);
    }

    const productResult = await db.query<{ id: string }>(
      `
      INSERT INTO products
        (category_id, name, slug, description, status)
      VALUES
        ($1::uuid, $2, $3, $4, $5::"ProductStatus")
      ON CONFLICT (slug)
      DO UPDATE SET
        category_id = EXCLUDED.category_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id::text AS id
      `,
      [
        categoryId,
        product.name,
        product.slug,
        product.description,
        product.status,
      ],
    );

    const productId = productResult.rows[0]?.id;
    if (!productId) {
      throw new Error(`Product upsert did not return an id for ${product.slug}`);
    }

    const specifications = {
      unit: product.unit,
      typicalSpecificationFields: product.typicalSpecs,
      sourcingStatus: product.sourcingStatus,
    };

    const existingVariant = await db.query<{ id: string }>(
      `
      SELECT id::text AS id
      FROM product_variants
      WHERE product_id = $1::uuid
        AND name = 'Standard sourcing'
      ORDER BY created_at ASC
      LIMIT 1
      `,
      [productId],
    );

    if (existingVariant.rows[0]?.id) {
      await db.query(
        `
        UPDATE product_variants
        SET specifications = $2::jsonb,
            updated_at = NOW()
        WHERE id = $1::uuid
        `,
        [existingVariant.rows[0].id, JSON.stringify(specifications)],
      );
    } else {
      await db.query(
        `
        INSERT INTO product_variants
          (product_id, name, specifications)
        VALUES
          ($1::uuid, 'Standard sourcing', $2::jsonb)
        `,
        [productId, JSON.stringify(specifications)],
      );
    }
  }
}
