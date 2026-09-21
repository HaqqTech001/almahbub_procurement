import "../load-env.js";
import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createDatabaseClient } from "@hamd/database";
import { parseEnvironment } from "../config/env.js";
import { catalogueStage } from "../modules/catalog/application/catalogue-stage.js";
import { attachDraftPrimary } from "../modules/catalog/application/attach-draft-primary.js";
import { requiresProductResearch } from "../modules/catalog/application/product-publication-review.js";
import { validateGeneratedPng } from "../modules/catalog/media/draft-catalogue-media.js";
import {
  parseStoredCatalogMediaUrl,
  assertCatalogMediaPath,
} from "../modules/catalog/infrastructure/catalog-media-path.js";
import { inspectReviewedMediaHash } from "../modules/catalog/infrastructure/reviewed-media-hash.js";
import { withConcurrency } from "../modules/catalog/infrastructure/product-media-health.js";
const root = fileURLToPath(new URL("../../../..", import.meta.url));
type Row = Record<string, unknown>;
async function main() {
  const args = process.argv.slice(2);
  if (
    args.some((a) => a !== "--execute" && !/^--product=[a-z0-9-]+$/.test(a)) ||
    args.filter((a) => a.startsWith("--product=")).length !== 1 ||
    args.filter((a) => a === "--execute").length > 1
  )
    throw new Error("One product required.");
  const slug = args.find((a) => a.startsWith("--product="))!.slice(10);
  const execute = args.includes("--execute");
  const env = parseEnvironment(process.env);
  if (!env.DATABASE_URL) throw new Error("Database not configured.");
  const db = createDatabaseClient(env.DATABASE_URL);
  try {
    const product = await catalogueStage("draft.lookup", () =>
      db.product.findUnique({
        where: { slug },
        include: { brand: true, images: true, variants: true },
      }),
    );
    if (
      !product ||
      product.status !== "draft" ||
      requiresProductResearch(product)
    )
      throw new Error("Only approved generic drafts may attach candidates.");
    const metadata = product.variants[0]?.specifications as Row | null;
    if (
      metadata?.catalogueWorkflow !== "electronics-p1-v1" ||
      metadata.mediaStrategy !== "generated_generic" ||
      metadata.identityStatus !== "approved"
    )
      throw new Error("Unapproved workflow.");
    const provenancePath = resolve(
      root,
      "docs/generated-product-media-provenance.json",
    );
    const visualPath = resolve(
      root,
      "docs/electronics-generic-media-review.json",
    );
    const provenance = JSON.parse(await readFile(provenancePath, "utf8")) as {
      rows: Row[];
    };
    const visuals = JSON.parse(await readFile(visualPath, "utf8")) as {
      products: Row[];
    };
    const candidate = provenance.rows.find(
      (r) => r.productId === product.id && r.status === "stored_pending_review",
    );
    if (!candidate)
      throw new Error("No pending candidate. Never regenerate automatically.");
    const review = visuals.products.find(
      (r) =>
        r.productId === product.id &&
        r.productName === product.name &&
        r.sha256 === candidate.sha256 &&
        r.visualReview === "approved_representative_generic",
    );
    if (!review) throw new Error("Exact candidate has no visual approval.");
    if (product.images.length)
      throw new Error(
        "Existing media retained. Reconcile provenance separately; no replacement allowed.",
      );
    const url = String(candidate.mediaUrl);
    const ref = parseStoredCatalogMediaUrl(url);
    if (
      !ref ||
      ref.productId !== product.id ||
      ref.filename !== candidate.storageKey
    )
      throw new Error("Invalid candidate mapping.");
    const safe = assertCatalogMediaPath(ref);
    // Candidate staging is local in this rollout. Durable copying is a separate reviewed step.
    if (!url.startsWith("/api/v1/public/catalog-media/"))
      throw new Error(
        "Remote candidate attachment requires a verified durable-copy record.",
      );
    const bytes = await readFile(
      resolve(env.UPLOAD_ROOT, "public/catalog", safe.productId, safe.filename),
    );
    const dimensions = validateGeneratedPng(bytes);
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (
      hash !== candidate.sha256 ||
      dimensions.width !== candidate.width ||
      dimensions.height !== candidate.height
    )
      throw new Error("Candidate bytes changed after visual review.");
    let cursor: string | undefined;
    for (;;) {
      const rows = await catalogueStage("media.lookup", () =>
        db.productImage.findMany({
          select: { id: true, url: true },
          take: 100,
          orderBy: { id: "asc" },
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      );
      const hashes = await withConcurrency(rows, (row) =>
        inspectReviewedMediaHash(row.url, env.UPLOAD_ROOT),
      );
      if (hashes.includes(hash))
        throw new Error("Unrelated binary reuse rejected.");
      if (rows.length < 100) break;
      cursor = rows.at(-1)!.id;
    }
    for (const category of await db.productCategory.findMany({
      select: { imageUrl: true },
    }))
      if (
        category.imageUrl &&
        (await inspectReviewedMediaHash(category.imageUrl, env.UPLOAD_ROOT)) ===
          hash
      )
        throw new Error("Category binary rejected.");
    if (!execute) {
      console.log(
        JSON.stringify({
          productSlug: slug,
          status: "attachment_ready",
          sha256: hash,
          publicationStatus: "draft",
        }),
      );
      return;
    }
    const image = await attachDraftPrimary(db, {
      productId: product.id,
      productName: product.name,
      updatedAt: product.updatedAt,
      url,
      storageKey: safe.filename,
      mimeType: "image/png",
      fileSize: bytes.length,
    });
    Object.assign(candidate, {
      status: "generated",
      reviewStatus: "visual_approved",
      productImageId: image.id,
    });
    Object.assign(review, { productImageId: image.id });
    for (const [target, data] of [
      [provenancePath, provenance],
      [visualPath, visuals],
    ] as const) {
      await writeFile(`${target}.tmp`, JSON.stringify(data, null, 2));
      await rename(`${target}.tmp`, target);
    }
    console.log(
      JSON.stringify({
        productSlug: slug,
        productImageId: image.id,
        status: "attached",
        publicationStatus: "draft",
        sha256: hash,
      }),
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Attachment failed. Reconcile any uncertain database outcome before retry.",
  );
  process.exitCode = 1;
});
