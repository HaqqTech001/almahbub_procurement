import { attachDraftPrimary } from "../application/attach-draft-primary.js";
import { catalogueStage } from "../application/catalogue-stage.js";
import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabaseClient } from "@hamd/database";
import { parseEnvironment } from "../../../config/env.js";
import { createCatalogImageGenerator } from "./create-catalog-image-generator.js";
import { createCatalogMediaStore } from "../infrastructure/catalog-media-store.js";
import { validateCatalogMediaUpload } from "../infrastructure/catalog-media-policy.js";
import { inspectReviewedMediaHash } from "../infrastructure/reviewed-media-hash.js";
import { withConcurrency } from "../infrastructure/product-media-health.js";
import { requiresProductResearch } from "../application/product-publication-review.js";
const root = fileURLToPath(new URL("../../../../../..", import.meta.url));
export const electronicsGenericPrompts: Readonly<
  Record<string, { subject: string; negative: string }>
> = {
  "20,000mAh Power Bank": {
    subject:
      "one unbranded 20,000mAh portable power bank, substantial rounded rectangular battery enclosure, visible USB-C socket and small indicator lights, complete compact device",
    negative:
      "not a wall charger, not a car battery, no phone, no capacity text or invented performance labels",
  },
  "USB-C Fast Charger": {
    subject:
      "one unbranded compact USB-C fast wall charger, complete insulated charger body, one clearly visible USB-C output port and complete mains plug, realistic electrical accessory proportions",
    negative:
      "not a power bank, not a cable alone, no phone, no invented wattage labels, no imitation of a recognizable branded charger",
  },
  "Wireless Earbuds": {
    subject:
      "one pair of generic wireless in-ear earbuds with rounded stemless earpieces, silicone ear tips and their open charging case, both complete earbuds and complete case visible, distinctive unbranded design",
    negative:
      "not over-ear headphones, no permanent wires, not Apple AirPods or Samsung Galaxy Buds replicas, no phone",
  },
  "Smartphone Gimbal": {
    subject:
      "one professional generic handheld smartphone gimbal stabilizer, three-axis motorized stabilizer with visible motor joints and empty adjustable phone clamp, complete ergonomic handheld grip, compact folding support arms shown assembled for use, physically plausible modern design, plain unmarked circular control buttons and joystick, blank unprinted control surfaces",
    negative:
      "not a tripod alone, not a selfie stick alone, not a camera-only gimbal, not a laptop stand, not unrelated electronics, no phone or camera included, no phone brand or logo, no DJI or other branded-model imitation, no printed letters or numbers including M, no control legends, no text or watermark",
  },
};
export function electronicsDraftPrompt(name: string): string | null {
  const rule = electronicsGenericPrompts[name];
  if (!rule) return null;
  return `Photorealistic ecommerce product photography of ${rule.subject}. Category: Electronics, Mobile & Digital Technology. Modern current-market design, realistic materials and proportions, complete item visible without cropping, centered with safe margins, front or three-quarter view, warm white/light gray studio background, soft realistic shadow, no people, no unrelated objects, no text, no watermark, no fake logo or invented brand, square 1:1. Negative constraints: ${rule.negative}.`;
}
function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export function validateGeneratedPng(bytes: Buffer): {
  width: number;
  height: number;
} {
  const issues = validateCatalogMediaUpload({
    filename: "generated.png",
    mimeType: "image/png",
    sizeBytes: bytes.length,
    kind: "image",
    bytes,
  });
  if (
    issues.length ||
    bytes.length < 33 ||
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    throw new Error("Invalid PNG binary.");
  let offset = 8,
    width = 0,
    height = 0,
    channels = 0,
    ended = false;
  const data: Buffer[] = [];
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    if (offset + length + 12 > bytes.length) throw new Error("Truncated PNG.");
    const kind = bytes.toString("ascii", offset + 4, offset + 8);
    if (
      crc32(bytes.subarray(offset + 4, offset + 8 + length)) !==
      bytes.readUInt32BE(offset + 8 + length)
    )
      throw new Error("PNG checksum failed.");
    if (kind === "IHDR") {
      if (offset !== 8 || length !== 13) throw new Error("Invalid PNG header.");
      width = bytes.readUInt32BE(offset + 8);
      height = bytes.readUInt32BE(offset + 12);
      const color = bytes[offset + 17];
      channels =
        color === 6
          ? 4
          : color === 2
            ? 3
            : color === 0
              ? 1
              : color === 4
                ? 2
                : 0;
      if (
        bytes[offset + 16] !== 8 ||
        bytes[offset + 18] !== 0 ||
        bytes[offset + 19] !== 0 ||
        bytes[offset + 20] !== 0
      )
        throw new Error("Unsupported PNG encoding.");
    }
    if (kind === "IDAT")
      data.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
    if (kind === "IEND") {
      ended = length === 0 && offset === bytes.length;
      break;
    }
  }
  if (
    !ended ||
    !channels ||
    width < 400 ||
    height < 400 ||
    width > 4096 ||
    height > 4096 ||
    !data.length
  )
    throw new Error("Invalid PNG dimensions/data.");
  const decoded = inflateSync(Buffer.concat(data), {
    maxOutputLength: 70 * 1024 * 1024,
  });
  const stride = width * channels + 1;
  if (decoded.length !== height * stride)
    throw new Error("Incomplete PNG pixels.");
  for (let row = 0; row < height; row++)
    if (decoded[row * stride]! > 4) throw new Error("Invalid PNG scanline.");
  return { width, height };
}
export async function generateApprovedDraft(argv: string[]): Promise<void> {
  if (
    argv.some(
      (arg) =>
        arg !== "--execute" &&
        arg !== "--replacement-candidate" &&
        !/^--draft-product=[a-z0-9-]+$/.test(arg),
    ) ||
    argv.filter((arg) => arg.startsWith("--draft-product=")).length !== 1 ||
    argv.filter((arg) => arg === "--execute").length > 1 ||
    argv.filter((arg) => arg === "--replacement-candidate").length > 1
  )
    throw new Error(
      "One explicit --draft-product=<slug> and optional --execute are required.",
    );
  const slug = argv
    .find((arg) => arg.startsWith("--draft-product="))!
    .slice(16);
  const execute = argv.includes("--execute");
  const replacementCandidate = argv.includes("--replacement-candidate");
  if (replacementCandidate && slug !== "electronics-smartphone-gimbal")
    throw new Error(
      "Replacement candidate scope is the reviewed P1 gimbal only.",
    );
  const env = parseEnvironment(process.env);
  if (!env.DATABASE_URL) throw new Error("Database is not configured.");
  const db = createDatabaseClient(env.DATABASE_URL);
  try {
    const product = await catalogueStage("draft.lookup", () =>
      db.product.findUnique({
        where: { slug },
        include: { category: true, brand: true, variants: true, images: true },
      }),
    );
    if (!product || product.status !== "draft")
      throw new Error("Only an existing approved draft can use this command.");
    const metadata = product.variants[0]?.specifications as Record<
      string,
      unknown
    > | null;
    if (
      metadata?.catalogueWorkflow !== "electronics-p1-v1" ||
      metadata.priorityTier !== "P1_SHOWCASE" ||
      metadata.identityStatus !== "approved" ||
      metadata.mediaStrategy !== "generated_generic" ||
      requiresProductResearch(product)
    )
      throw new Error("Draft is outside the approved generic P1 scope.");
    const prompt = electronicsDraftPrompt(product.name);
    if (!prompt) throw new Error("No approved visual identity for this draft.");
    const generator = createCatalogImageGenerator(env);
    const base = {
      productId: product.id,
      productSlug: slug,
      productName: product.name,
      category: product.category?.name,
      strategy: "generated_generic",
      generatedPrompt: prompt,
      generationProvider: generator ? "openai" : null,
      publicationStatus: "draft",
      candidateOnly: replacementCandidate,
      productionBlocked:
        env.CATALOG_MEDIA_DRIVER === "local"
          ? "durable_storage_required"
          : null,
    };
    if (product.images.length) {
      console.log(
        JSON.stringify({ ...base, status: "kept_existing" }, null, 2),
      );
      return;
    }
    if (!execute || !generator) {
      console.log(
        JSON.stringify(
          {
            ...base,
            status: generator
              ? "generation_ready"
              : "generation_provider_not_configured",
          },
          null,
          2,
        ),
      );
      return;
    }
    const target = join(root, "docs/generated-product-media-provenance.json");
    let history: { rows: unknown[] } = { rows: [] };
    try {
      history = JSON.parse(await readFile(target, "utf8"));
      if (!Array.isArray(history.rows))
        throw new Error("Invalid provenance history.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (
      history.rows.some(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          "productSlug" in item &&
          item.productSlug === slug &&
          "status" in item &&
          (replacementCandidate
            ? ["stored_pending_attachment", "stored_pending_review"]
            : [
                "stored_pending_attachment",
                "attachment_failed",
                "stored_pending_review",
              ]
          ).includes(String(item.status)),
      )
    )
      throw new Error(
        "Stored candidate already exists; review and recover it without generating again.",
      );
    const hashes = new Set<string>();
    let cursor: string | undefined;
    for (;;) {
      const images = await db.productImage.findMany({
        select: { id: true, url: true },
        take: 100,
        orderBy: { id: "asc" },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      const results = await withConcurrency(images, (image) =>
        inspectReviewedMediaHash(image.url, env.UPLOAD_ROOT),
      );
      results.forEach((hash) => {
        if (hash) hashes.add(hash);
      });
      if (images.length < 100) break;
      cursor = images.at(-1)!.id;
    }
    const categories = await db.productCategory.findMany({
      select: { imageUrl: true },
    });
    for (const category of categories)
      if (category.imageUrl) {
        const hash = await inspectReviewedMediaHash(
          category.imageUrl,
          env.UPLOAD_ROOT,
        );
        if (hash) hashes.add(hash);
      }
    // Check again immediately before incurring provider cost.
    if (
      await catalogueStage("media.lookup", () =>
        db.productImage.count({ where: { productId: product.id } }),
      )
    )
      throw new Error("Media was added concurrently; no generation performed.");
    const generated = await generator.generate({ prompt, productSlug: slug });
    if (generated.mimeType !== "image/png")
      throw new Error("Unsupported generated MIME type.");
    const dimensions = validateGeneratedPng(generated.bytes);
    const sha256 = createHash("sha256").update(generated.bytes).digest("hex");
    if (hashes.has(sha256))
      throw new Error("Duplicate/category image binary rejected.");
    const store = createCatalogMediaStore({
      uploadRoot: env.UPLOAD_ROOT,
      driver: env.CATALOG_MEDIA_DRIVER,
      nodeEnv: env.NODE_ENV,
      s3Bucket: env.CATALOG_MEDIA_S3_BUCKET,
      s3Region: env.AWS_REGION,
      s3AccessKeyId: env.AWS_ACCESS_KEY_ID,
      s3SecretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      s3PublicBaseUrl: env.CATALOG_MEDIA_S3_PUBLIC_BASE_URL,
      supabaseUrl: env.CATALOG_MEDIA_SUPABASE_URL,
      supabaseServiceRoleKey: env.CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY,
      supabaseBucket: env.CATALOG_MEDIA_SUPABASE_BUCKET,
    });
    const stored = await store.put({
      productId: product.id,
      originalFilename: `${slug}-generated.png`,
      bytes: generated.bytes,
    });
    if (
      (await inspectReviewedMediaHash(stored.publicUrl, env.UPLOAD_ROOT)) !==
      sha256
    )
      throw new Error(
        "Stored binary verification failed; draft unchanged, orphan cleanup required.",
      );
    const pending = {
      ...base,
      status: replacementCandidate
        ? "stored_pending_review"
        : "stored_pending_attachment",
      provider: generated.provider,
      model: generated.model,
      size: generated.size,
      quality: generated.quality,
      mimeType: generated.mimeType,
      ...dimensions,
      sha256,
      storageKey: stored.filename,
      mediaUrl: stored.publicUrl,
      generatedAt: new Date().toISOString(),
    };
    history.rows.push(pending);
    await writeFile(`${target}.tmp`, JSON.stringify(history, null, 2));
    await rename(`${target}.tmp`, target);
    if (replacementCandidate) {
      console.log(
        JSON.stringify(
          {
            ...pending,
            reviewStatus: "visual_review_required",
            productImageAttached: false,
          },
          null,
          2,
        ),
      );
      return;
    }
    const image = await attachDraftPrimary(db, {
      productId: product.id,
      productName: product.name,
      updatedAt: product.updatedAt,
      url: stored.publicUrl,
      storageKey: stored.filename,
      mimeType: generated.mimeType,
      fileSize: generated.bytes.length,
    });
    const row = {
      ...base,
      status: "generated",
      reviewStatus: "visual_review_pending",
      provider: generated.provider,
      model: generated.model,
      size: generated.size,
      quality: generated.quality,
      mimeType: "image/png",
      ...dimensions,
      sha256,
      storageKey: stored.filename,
      mediaUrl: stored.publicUrl,
      productImageId: image.id,
      generatedAt: new Date().toISOString(),
    };
    history.rows[history.rows.indexOf(pending)] = row;
    await writeFile(
      `${target}.tmp`,
      JSON.stringify(
        {
          ...history,
          generatedAt: new Date().toISOString(),
          rows: history.rows,
        },
        null,
        2,
      ),
    );
    await rename(`${target}.tmp`, target);
    console.log(JSON.stringify(row, null, 2));
  } finally {
    await db.$disconnect();
  }
}
