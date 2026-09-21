import "../load-env.js";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createDatabaseClient } from "@hamd/database";
import { parseEnvironment } from "../config/env.js";
import { catalogueStage } from "../modules/catalog/application/catalogue-stage.js";
import {
  primaryImage,
  reviewFingerprint,
  requiresProductResearch,
  physicalCategoryMatches,
  weakProductIdentity,
  conceptIdentity,
  categoryArtUsed,
  rejectedMediaHashes,
  type PublicationReview,
} from "../modules/catalog/application/product-publication-review.js";
import { inspectReviewedMediaHash } from "../modules/catalog/infrastructure/reviewed-media-hash.js";
import { withConcurrency } from "../modules/catalog/infrastructure/product-media-health.js";
import {
  assertCatalogMediaPath,
  parseStoredCatalogMediaUrl,
} from "../modules/catalog/infrastructure/catalog-media-path.js";
import { validateGeneratedPng } from "../modules/catalog/media/draft-catalogue-media.js";
const root = fileURLToPath(new URL("../../../..", import.meta.url));
async function reportFile(name: string): Promise<Record<string, unknown>[]> {
  try {
    const doc = JSON.parse(await readFile(resolve(root, "docs", name), "utf8"));
    return doc.products ?? doc.rows ?? [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new Error(`Invalid review report: ${name}`);
  }
}
async function main() {
  const args = process.argv.slice(2);
  if (
    args.some(
      (arg) => arg !== "--execute" && !/^--product=[a-z0-9-]+$/.test(arg),
    ) ||
    args.filter((arg) => arg.startsWith("--product=")).length !== 1 ||
    args.filter((arg) => arg === "--execute").length > 1
  )
    throw new Error(
      "One --product=<slug> and optional --execute required; no bulk approval.",
    );
  const slug = args.find((arg) => arg.startsWith("--product="))!.slice(10);
  const execute = args.includes("--execute");
  const env = parseEnvironment(process.env);
  if (!env.DATABASE_URL) throw new Error("Database is not configured.");
  const db = createDatabaseClient(env.DATABASE_URL);
  try {
    const product = await catalogueStage("draft.lookup", () =>
      db.product.findUnique({
        where: { slug },
        include: { category: true, brand: true, images: true, variants: true },
      }),
    );
    if (!product) throw new Error("Product not found.");
    const blockers: string[] = [];
    const block = (condition: boolean, reason: string) => {
      if (condition) blockers.push(reason);
    };
    const variant = product.variants.find(
      (v) =>
        (v.specifications as Record<string, unknown> | null)
          ?.catalogueWorkflow === "electronics-p1-v1",
    );
    const meta = (variant?.specifications ?? {}) as Record<string, unknown>;
    block(product.status !== "draft", "product_not_draft");
    block(
      meta.identityStatus !== "approved" || meta.priorityTier !== "P1_SHOWCASE",
      "identity_or_P1_scope_not_approved",
    );
    block(weakProductIdentity(product.name), "weak_identity");
    block(
      !physicalCategoryMatches(product) ||
        product.category?.status !== "published",
      "category_not_approved",
    );
    const branded = requiresProductResearch(product);
    const researchRows = await reportFile(
      "electronics-current-product-research-results.json",
    );
    const research = researchRows.find(
      (r) =>
        r.slug === slug &&
        r.verifiedName === product.name &&
        r.catalogueDecision === "APPROVED_FOR_DRAFT",
    );
    block(branded && !research, "research_incomplete");
    block(
      !branded && meta.mediaStrategy !== "generated_generic",
      "media_strategy_not_approved",
    );
    const image = primaryImage(product);
    block(!image, "primary_image_missing");
    block(categoryArtUsed(product), "category_art_reused");
    const visualRows = await reportFile(
      branded
        ? "electronics-branded-media-review.json"
        : "electronics-generic-media-review.json",
    );
    const visual = visualRows.find(
      (r) =>
        r.productId === product.id &&
        (branded
          ? r.reviewStatus === "MEDIA_APPROVED"
          : r.visualReview === "approved_representative_generic") &&
        r.productImageId === image?.id,
    );
    block(!visual, "media_semantic_review_missing");
    block(
      Boolean(visual && visual.productName !== product.name),
      "visual_review_identity_mismatch",
    );
    block(
      Boolean(
        visual &&
        !Number.isFinite(
          Date.parse(String(visual.reviewedAt ?? visual.checkedAt)),
        ),
      ),
      "visual_review_date_missing",
    );
    if (branded && research) {
      let official = false;
      try {
        const url = new URL(String(research.officialSourceUrl));
        official =
          url.protocol === "https:" &&
          /(^|\.)apple\.com$|(^|\.)samsung\.com$/.test(url.hostname);
      } catch {
        official = false;
      }
      block(
        !official ||
          research.brand !== product.brand?.name ||
          research.model !== meta.exactModel ||
          !Number.isFinite(Date.parse(String(research.checkedAt))) ||
          Date.parse(String(research.checkedAt)) > Date.now(),
        "research_identity_or_source_invalid",
      );
    }
    const provenanceRows = await reportFile(
      "generated-product-media-provenance.json",
    );
    const provenance = branded
      ? visual
      : provenanceRows.find(
          (r) =>
            r.productId === product.id &&
            r.productImageId === image?.id &&
            r.status === "generated",
        );
    block(!provenance, "media_provenance_missing");
    block(
      !branded &&
        Boolean(provenance) &&
        [
          "provider",
          "model",
          "size",
          "quality",
          "generatedPrompt",
          "generatedAt",
        ].some(
          (key) =>
            typeof provenance![key] !== "string" ||
            !String(provenance![key]).trim(),
        ),
      "generation_provenance_incomplete",
    );
    block(
      branded && visual?.usageRightsStatus !== "approved",
      "branded_media_rights_not_approved",
    );
    const hash = image
      ? await catalogueStage("media.lookup.hash", () =>
          inspectReviewedMediaHash(image.url, env.UPLOAD_ROOT),
        )
      : null;
    block(!hash, "media_binary_unreachable");
    block(Boolean(hash && rejectedMediaHashes[hash]), "rejected_binary");
    block(
      Boolean(hash && (visual?.sha256 ?? visual?.candidateSha256) !== hash),
      "visual_review_hash_mismatch",
    );
    block(
      Boolean(
        hash && (provenance?.sha256 ?? provenance?.candidateSha256) !== hash,
      ),
      "provenance_hash_mismatch",
    );
    const ref = image ? parseStoredCatalogMediaUrl(image.url) : null;
    block(
      !ref ||
        ref.productId !== product.id ||
        ref.filename !== image?.storageKey,
      "governed_storage_mapping_invalid",
    );
    let durable = false;
    if (
      image &&
      env.CATALOG_MEDIA_DRIVER !== "local" &&
      /^https:\/\//.test(image.url)
    ) {
      const actual = new URL(image.url);
      const base =
        env.CATALOG_MEDIA_DRIVER === "supabase" &&
        env.CATALOG_MEDIA_SUPABASE_URL
          ? `${env.CATALOG_MEDIA_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${env.CATALOG_MEDIA_SUPABASE_BUCKET}/catalog/`
          : env.CATALOG_MEDIA_DRIVER === "s3" && env.CATALOG_MEDIA_S3_BUCKET
            ? `${(env.CATALOG_MEDIA_S3_PUBLIC_BASE_URL ?? `https://${env.CATALOG_MEDIA_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`).replace(/\/$/, "")}/catalog/`
            : null;
      durable = Boolean(base && actual.href.startsWith(base));
    }
    block(!durable, "durable_storage_required");
    let technical = false;
    if (
      image &&
      ref &&
      product.images.find((row) => row.id === image.id)?.mimeType ===
        "image/png"
    ) {
      try {
        const safe = assertCatalogMediaPath(ref);
        let bytes: Buffer;
        if (image.url.startsWith("/api/v1/public/catalog-media/"))
          bytes = await readFile(
            resolve(
              env.UPLOAD_ROOT,
              "public/catalog",
              safe.productId,
              safe.filename,
            ),
          );
        else if (durable) {
          const response = await fetch(image.url, {
            redirect: "error",
            signal: AbortSignal.timeout(15000),
          });
          if (!response.ok || !response.body)
            throw new Error("Binary unavailable");
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of response.body) {
            size += chunk.length;
            if (size > 10 * 1024 * 1024) throw new Error("Oversized image");
            chunks.push(Buffer.from(chunk));
          }
          bytes = Buffer.concat(chunks);
        } else throw new Error("Untrusted storage");
        const dimensions = validateGeneratedPng(bytes);
        technical =
          createHash("sha256").update(bytes).digest("hex") === hash &&
          dimensions.width === provenance?.width &&
          dimensions.height === provenance?.height;
      } catch {
        technical = false;
      }
    }
    block(!technical, "media_technical_validation_not_approved");
    let cursor: string | undefined;
    for (;;) {
      const rows = await catalogueStage("duplicate.lookup", () =>
        db.product.findMany({
          take: 100,
          orderBy: { id: "asc" },
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          select: {
            id: true,
            name: true,
            images: { select: { url: true, storageKey: true } },
          },
        }),
      );
      for (const row of rows)
        if (row.id !== product.id) {
          block(
            conceptIdentity(row.name) === conceptIdentity(product.name),
            "duplicate_product_identity",
          );
          for (const other of row.images)
            block(
              Boolean(
                image &&
                (other.url === image.url ||
                  (image.storageKey && other.storageKey === image.storageKey)),
              ),
              "duplicate_media_association",
            );
        }
      if (hash) {
        const others = rows
          .filter((row) => row.id !== product.id)
          .flatMap((row) => row.images);
        const hashes = await withConcurrency(others, (other) =>
          inspectReviewedMediaHash(other.url, env.UPLOAD_ROOT),
        );
        block(hashes.includes(hash), "duplicate_unrelated_binary");
      }
      if (rows.length < 100) break;
      cursor = rows.at(-1)!.id;
    }
    const categoryImages = await db.productCategory.findMany({
      select: { imageUrl: true },
    });
    if (hash)
      for (const category of categoryImages)
        if (category.imageUrl)
          block(
            (await inspectReviewedMediaHash(
              category.imageUrl,
              env.UPLOAD_ROOT,
            )) === hash,
            "category_binary_reused",
          );
    const blockingReasons = [...new Set(blockers)];
    const output = {
      productId: product.id,
      productSlug: slug,
      productName: product.name,
      execute,
      eligibleForPublicApproval: blockingReasons.length === 0,
      blockingReasons,
      status: "blocked",
    };
    if (!blockingReasons.length) {
      output.status = "approval_ready";
      if (execute) {
        const review: PublicationReview = {
          productId: product.id,
          slug,
          productName: product.name,
          fingerprint: reviewFingerprint(product),
          identityStatus: "approved",
          categoryStatus: "approved",
          duplicateStatus: "clear",
          mediaStatus: "approved",
          mediaSemanticStatus: "approved",
          commercialRelevance: "Approved curated P1 procurement product",
          reviewedBy: "catalogue approval command with recorded visual review",
          checkedAt: new Date().toISOString(),
          primaryImageId: image!.id,
          sha256: hash!,
          mediaIdentity: product.name,
          semanticEvidence: String(visual!.evidence ?? visual!.reviewNotes),
          mediaSource: branded
            ? String(visual!.mediaCandidateSource)
            : "Governed generated representative media",
          mediaRights: branded
            ? String(visual!.usageRightsStatus)
            : "Generated through configured provider; representative generic identity",
          priorityTier: "P1_SHOWCASE",
          ...(research
            ? {
                research: {
                  manufacturer: String(research.brand),
                  model: String(research.model),
                  generation: String(research.family),
                  marketStatus: String(research.currentMarketStatus),
                  officialSource: String(research.officialSourceUrl),
                  checkedAt: String(research.checkedAt),
                },
              }
            : {}),
        };
        const specifications = {
          ...meta,
          publicationStatus: "PUBLIC_APPROVED",
          publicationReview: review,
        };
        const changed = await catalogueStage(
          "publication-state.update",
          () => db.$queryRaw<{ id: string }[]>`
     WITH target AS (
      SELECT p.id, v.id AS variant_id FROM products p JOIN product_variants v ON v.product_id=p.id
      WHERE p.id=${product.id}::uuid AND p.status='draft' AND p.updated_at=${product.updatedAt}
       AND v.id=${variant!.id}::uuid AND v.specifications=${JSON.stringify(meta)}::jsonb
       AND EXISTS(SELECT 1 FROM product_images i WHERE i.id=${image!.id}::uuid AND i.product_id=p.id AND i.url=${image!.url} AND i.storage_key=${image!.storageKey})
      FOR UPDATE OF p,v
     ), reviewed AS (
      UPDATE product_variants v SET specifications=${JSON.stringify(specifications)}::jsonb,updated_at=now()
      FROM target WHERE v.id=target.variant_id RETURNING v.product_id
     ) UPDATE products p SET status='published',updated_at=now() FROM reviewed WHERE p.id=reviewed.product_id RETURNING p.id
    `,
        );
        if (changed.length !== 1)
          throw new Error("Concurrent product edit prevented approval.");
        output.status = "PUBLIC_APPROVED";
      }
    }
    await writeFile(
      resolve(root, `docs/approval-${slug}.json`),
      JSON.stringify(output, null, 2),
    );
    console.log(JSON.stringify(output, null, 2));
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error &&
      error.message.startsWith("Catalogue stage failed:")
      ? error.message
      : "Approval failed; product was not knowingly approved. Inspect recorded stage and reconcile uncertain writes before retry.",
  );
  process.exitCode = 1;
});
