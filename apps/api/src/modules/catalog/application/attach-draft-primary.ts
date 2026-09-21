import { randomUUID } from "node:crypto";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import { catalogueStage } from "./catalogue-stage.js";

/** One atomic statement, after bytes/rights/visual validation and storage.
 * Locks the draft and refuses stale edits or an existing image. No provider,
 * network, hashing, filesystem work, or interactive transaction is involved.
 */
export async function attachDraftPrimary(
  db: DatabaseClient,
  input: {
    productId: string;
    productName: string;
    updatedAt: Date;
    url: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
  },
): Promise<{ id: string }> {
  const id = randomUUID();
  const rows = await catalogueStage(
    "ProductImage.create",
    () => db.$queryRaw<{ id: string }[]>`
    WITH eligible AS (
      SELECT id FROM products
      WHERE id = ${input.productId}::uuid AND status = 'draft'
        AND name = ${input.productName} AND updated_at = ${input.updatedAt}
      FOR UPDATE
    )
    INSERT INTO product_images
      (id, product_id, url, storage_key, mime_type, file_size, alt_text, caption, position, is_primary, created_at)
    SELECT ${id}::uuid, eligible.id, ${input.url}, ${input.storageKey}, ${input.mimeType},
      ${input.fileSize}, ${`Representative generic ${input.productName}`},
      'Reviewed representative catalogue media', 0, true, now()
    FROM eligible
    WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = eligible.id)
    ON CONFLICT (product_id, position) DO NOTHING
    RETURNING id
  `,
  );
  if (rows.length !== 1)
    throw new Error(
      "Draft changed or media already exists; candidate retained, nothing overwritten.",
    );
  return rows[0]!;
}
