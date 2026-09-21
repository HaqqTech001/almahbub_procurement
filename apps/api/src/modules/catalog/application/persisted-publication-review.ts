import { z } from "zod";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import type { PublicationReview } from "./product-publication-review.js";
const text = z.string().trim().min(1);
export const publicationReviewSchema = z.object({
  productId: text,
  slug: text,
  productName: text,
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  identityStatus: z.literal("approved"),
  categoryStatus: z.literal("approved"),
  duplicateStatus: z.literal("clear"),
  mediaStatus: z.literal("approved"),
  mediaSemanticStatus: z.literal("approved"),
  commercialRelevance: text,
  reviewedBy: text,
  checkedAt: text,
  primaryImageId: text,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  mediaIdentity: text,
  semanticEvidence: text,
  mediaSource: text,
  mediaRights: text,
  priorityTier: z.enum(["P1_SHOWCASE", "P2_CORE", "P3_EXPANSION"]),
  research: z
    .object({
      manufacturer: text,
      model: text,
      generation: text,
      marketStatus: text,
      officialSource: z.string().url(),
      checkedAt: text,
    })
    .optional(),
});
export async function persistedPublicationReviews(
  db: DatabaseClient,
): Promise<PublicationReview[]> {
  const result: PublicationReview[] = [];
  let cursor: string | undefined;
  for (;;) {
    const rows = await db.productVariant.findMany({
      where: {
        product: { status: "published" },
        specifications: {
          path: ["publicationStatus"],
          equals: "PUBLIC_APPROVED",
        },
      },
      orderBy: { id: "asc" },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, productId: true, specifications: true },
    });
    for (const row of rows) {
      const metadata = row.specifications as Record<string, unknown> | null;
      const parsed = publicationReviewSchema.safeParse(
        metadata?.publicationReview,
      );
      if (parsed.success && parsed.data.productId === row.productId) {
        const { research, ...base } = parsed.data;
        result.push({ ...base, ...(research ? { research } : {}) });
      }
    }
    if (rows.length < 100) return result;
    cursor = rows.at(-1)!.id;
  }
}
