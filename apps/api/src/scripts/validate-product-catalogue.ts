import { persistedPublicationReviews } from "../modules/catalog/application/persisted-publication-review.js";
import "../load-env.js";
import { createHash } from "node:crypto";
import { readFile, writeFile, rename, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabaseClient } from "@hamd/database";
import { parseEnvironment } from "../config/env.js";
import {
  productPublicationReviews as releaseReviews,
  physicalCategoryMatches,
  rejectedMediaHashes,
  primaryImage,
  reviewFingerprint,
  reviewIsCurrent,
  mediaKeys,
  categoryArtUsed,
  conceptIdentity,
  weakProductIdentity,
  requiresProductResearch,
  legitimateSharedMedia,
  type ReviewProduct,
} from "../modules/catalog/application/product-publication-review.js";
import {
  inspectProductMedia,
  withConcurrency,
} from "../modules/catalog/infrastructure/product-media-health.js";
import {
  parseStoredCatalogMediaUrl,
  assertCatalogMediaPath,
} from "../modules/catalog/infrastructure/catalog-media-path.js";

import { commodityVisualObservations } from "../modules/catalog/application/commodity-visual-observations.js";

const root = fileURLToPath(new URL("../../../..", import.meta.url));
async function main() {
  const args = process.argv.slice(2);
  if (
    args.length > 1 ||
    args.some((arg) => !/^--category=[a-z0-9-]+$/.test(arg))
  )
    throw new Error(
      "Only --category=<slug> is supported. This audit is read-only.",
    );
  const categorySlug = args[0]?.slice("--category=".length);
  const env = parseEnvironment(process.env);
  if (!env.DATABASE_URL)
    throw new Error("Database is not configured; previous reports preserved.");
  const db = createDatabaseClient(env.DATABASE_URL);
  try {
    const productPublicationReviews = [...releaseReviews, ...await persistedPublicationReviews(db)];
    await db.$queryRaw`SELECT 1`;
    console.log(
      "Database connected. Read-only validation; no publication or data mutations.",
    );
    const categories = await db.productCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        imageStorageKey: true,
      },
    });
    if (categorySlug && !categories.some((row) => row.slug === categorySlug))
      throw new Error("Unknown category; previous reports preserved.");
    const products: ReviewProduct[] = [];
    let cursor: string | undefined;
    for (;;) {
      const batch = await db.product.findMany({
        take: 100,
        orderBy: { id: "asc" },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          status: true,
          category: true,
          brand: { select: { name: true } },
          images: {
            where: { OR: [{ isPrimary: true }, { position: 0 }] },
            orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
            take: 1,
          },
        },
      });
      products.push(...batch);
      console.log(`Product identities discovered: ${products.length}`);
      if (batch.length < 100) break;
      cursor = batch.at(-1)!.id;
    }
    let provenance: { rows?: Record<string, unknown>[] } = {};
    try {
      provenance = JSON.parse(
        await readFile(
          join(root, "docs/generated-product-media-provenance.json"),
          "utf8",
        ),
      );
    } catch {
      /* missing provenance is not approval */
    }
    const uploadRoot = resolve(env.UPLOAD_ROOT || "uploads");
    const hashes = new Map<string, string>();
    // Read only safe governed local paths, capped per binary. Remote hashes require provenance.
    await withConcurrency(products, async (product) => {
      const image = primaryImage(product);
      if (!image) return;
      const ref = parseStoredCatalogMediaUrl(image.url);
      if (ref) {
        try {
          const safe = assertCatalogMediaPath(ref);
          const path = resolve(
            uploadRoot,
            "public/catalog",
            safe.productId,
            safe.filename,
          );
          if ((await stat(path)).size <= 20 * 1024 * 1024)
            hashes.set(
              product.id,
              createHash("sha256")
                .update(await readFile(path))
                .digest("hex"),
            );
        } catch {
          /* unavailable binary remains unverified */
        }
      }
      if (!hashes.has(product.id)) {
        const record = provenance.rows?.find(
          (row) =>
            row.productId === product.id &&
            (row.mediaUrl === image.url ||
              row.newMediaUrl === image.url ||
              (image.storageKey &&
                (row.storageKey === image.storageKey ||
                  row.newStorageKey === image.storageKey))),
        );
        const hash = record?.newSha256 ?? record?.sha256;
        if (typeof hash === "string" && /^[a-f0-9]{64}$/i.test(hash))
          hashes.set(product.id, hash);
      }
    });
    const categoryHashes = new Set<string>();
    await withConcurrency(categories, async (category) => {
      const ref = category.imageUrl
        ? parseStoredCatalogMediaUrl(category.imageUrl)
        : null;
      if (!ref) return;
      try {
        const safe = assertCatalogMediaPath(ref);
        const path = resolve(
          uploadRoot,
          "public/catalog",
          safe.productId,
          safe.filename,
        );
        if ((await stat(path)).size <= 20 * 1024 * 1024)
          categoryHashes.add(
            createHash("sha256")
              .update(await readFile(path))
              .digest("hex"),
          );
      } catch {
        /* no invented match */
      }
    });
    const clusters = new Map<string, ReviewProduct[]>();
    const concepts = new Map<string, ReviewProduct[]>();
    for (const product of products) {
      for (const key of mediaKeys(product, hashes.get(product.id)))
        clusters.set(key, [...(clusters.get(key) ?? []), product]);
      const key = conceptIdentity(product.name);
      concepts.set(key, [...(concepts.get(key) ?? []), product]);
    }
    const selected = products
      .filter(
        (product) => !categorySlug || product.category?.slug === categorySlug,
      )
      .sort((a, b) => a.slug.localeCompare(b.slug));
    const rows = await withConcurrency(selected, async (product) => {
      const image = primaryImage(product);
      const review = productPublicationReviews.find(
        (row) => row.productId === product.id,
      );
      const flags: string[] = [];
      if (weakProductIdentity(product.name))
        flags.push("PUBLIC_HIDDEN_LOW_QUALITY");
      const duplicates = (
        concepts.get(conceptIdentity(product.name)) ?? []
      ).filter((row) => row.id !== product.id);
      if (duplicates.length) flags.push("PUBLIC_HIDDEN_DUPLICATE");
      const tokens = new Set(conceptIdentity(product.name).split(" "));
      const nearDuplicates = products.filter((other) => {
        if (
          other.id === product.id ||
          other.category?.slug !== product.category?.slug ||
          duplicates.some((row) => row.id === other.id)
        )
          return false;
        const otherTokens = new Set(conceptIdentity(other.name).split(" "));
        const shared = [...tokens].filter((token) =>
          otherTokens.has(token),
        ).length;
        return (
          shared >= 2 &&
          shared / new Set([...tokens, ...otherTokens]).size >= 0.75
        );
      });
      if (nearDuplicates.length) flags.push("SEMANTIC_NEAR_DUPLICATE_REVIEW");
      const shared = [
        ...new Set(
          mediaKeys(product, hashes.get(product.id))
            .flatMap((key) => clusters.get(key) ?? [])
            .filter((row) => row.id !== product.id)
            .map((row) => row.id),
        ),
      ];
      if (
        shared.some(
          (id) =>
            !legitimateSharedMedia(
              review,
              productPublicationReviews.find((row) => row.productId === id),
            ),
        )
      )
        flags.push("PUBLIC_HIDDEN_DUPLICATE_MEDIA");
      const categoryImageReused =
        categoryHashes.has(hashes.get(product.id) ?? "") ||
        categoryArtUsed(product) ||
        Boolean(
          image &&
          categories.some(
            (category) =>
              category.imageUrl === image.url ||
              (image.storageKey &&
                category.imageStorageKey === image.storageKey),
          ),
        );
      const technicalMediaStatus = await inspectProductMedia(
        image?.url,
        uploadRoot,
      );
      const categoryMatches = physicalCategoryMatches(product);
      if (!categoryMatches) flags.push("CATEGORY_MISMATCH");
      if (
        categoryImageReused ||
        technicalMediaStatus !== "valid" ||
        rejectedMediaHashes[hashes.get(product.id) ?? ""]
      )
        flags.push("PUBLIC_HIDDEN_BAD_MEDIA");
      const mediaSemanticStatus = rejectedMediaHashes[
        hashes.get(product.id) ?? ""
      ]
        ? "rejected"
        : reviewIsCurrent(product, review)
          ? "approved"
          : "unverified";
      if (mediaSemanticStatus !== "approved")
        flags.push("MEDIA_RELEVANCE_REVIEW_REQUIRED");
      const researchRequired = requiresProductResearch(product);
      if (researchRequired && !reviewIsCurrent(product, review))
        flags.push("CURRENT_PRODUCT_RESEARCH");
      if (!reviewIsCurrent(product, review))
        flags.push("PUBLICATION_REVIEW_REQUIRED");
      if (product.status !== "published") flags.push("NOT_PUBLISHED");
      return {
        productId: product.id,
        productName: product.name,
        slug: product.slug,
        category: product.category?.slug ?? null,
        publishedStatus: product.status,
        publicStatus: flags.length
          ? (flags.find((flag) => flag.startsWith("PUBLIC_HIDDEN")) ??
            "MANUAL_REVIEW")
          : "PUBLIC_APPROVED",
        flags,
        researchRequired,
        needsGeneration:
          !researchRequired &&
          categoryMatches &&
          !duplicates.length &&
          technicalMediaStatus !== "valid" &&
          !weakProductIdentity(product.name),
        technicalMediaStatus,
        mediaSemanticStatus,
        semanticReviewNote:
          rejectedMediaHashes[hashes.get(product.id) ?? ""] ?? null,
        categoryImageReused,
        primaryImage: image ?? null,
        sha256: hashes.get(product.id) ?? null,
        reviewFingerprint: reviewFingerprint(product),
        duplicateProducts: duplicates.map((row) => row.slug),
        nearDuplicateProducts: nearDuplicates.map((row) => row.slug),
        sharedMediaProductIds: shared,
      };
    });
    // Commodities remain their own CMS entities, never Product records.
    const commodities = await db.integratedExportCommodity.findMany({
      orderBy: { slug: "asc" },
    });
    const commodityReview = await withConcurrency(commodities, async (row) => {
      const hero =
        row.heroMedia &&
        typeof row.heroMedia === "object" &&
        !Array.isArray(row.heroMedia)
          ? (row.heroMedia as Record<string, unknown>)
          : {};
      let sha256: string | null = null;
      const ref =
        typeof hero.src === "string"
          ? parseStoredCatalogMediaUrl(hero.src)
          : null;
      if (ref) {
        try {
          const safe = assertCatalogMediaPath(ref);
          const path = resolve(
            uploadRoot,
            "public/catalog",
            safe.productId,
            safe.filename,
          );
          if ((await stat(path)).size <= 20 * 1024 * 1024)
            sha256 = createHash("sha256")
              .update(await readFile(path))
              .digest("hex");
        } catch {
          /* remains unverified */
        }
      }
      const observed = sha256 ? commodityVisualObservations[sha256] : undefined;
      const observation = observed?.slug === row.slug ? observed : undefined;
      const duplicates = commodities.filter(
        (other) =>
          other.id !== row.id &&
          (conceptIdentity(other.name) === conceptIdentity(row.name) ||
            (hero.src &&
              other.heroMedia &&
              typeof other.heroMedia === "object" &&
              !Array.isArray(other.heroMedia) &&
              other.heroMedia.src === hero.src)),
      );
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        published: row.published,
        route: `/businesses/almahbub-integrated-export/commodities/${row.slug}`,
        heroMedia: row.heroMedia,
        sha256,
        visualObservation: observation ?? null,
        shortDescription: row.shortDescription,
        description: row.description,
        duplicateSlugs: duplicates.map((other) => other.slug),
        identityStatus: observation
          ? "legitimate_commodity"
          : "review_required",
        mediaSemanticStatus: observation?.status ?? "visual_review_required",
        descriptionStatus: observation
          ? "belongs_to_commodity"
          : "review_required",
        metadataSource: "IntegratedExportCommodity CMS",
        productRecordsUsed: false,
      };
    });
    const counts = {
      total: rows.length,
      publicApproved: rows.filter(
        (row) => row.publicStatus === "PUBLIC_APPROVED",
      ).length,
      hiddenWeakIdentity: rows.filter((row) =>
        row.flags.includes("PUBLIC_HIDDEN_LOW_QUALITY"),
      ).length,
      hiddenDuplicate: rows.filter((row) =>
        row.flags.includes("PUBLIC_HIDDEN_DUPLICATE"),
      ).length,
      hiddenDuplicateMedia: rows.filter((row) =>
        row.flags.includes("PUBLIC_HIDDEN_DUPLICATE_MEDIA"),
      ).length,
      hiddenBadMedia: rows.filter((row) =>
        row.flags.includes("PUBLIC_HIDDEN_BAD_MEDIA"),
      ).length,
      needsResearch: rows.filter(
        (row) => row.researchRequired && row.publicStatus !== "PUBLIC_APPROVED",
      ).length,
      needsGeneration: rows.filter((row) => row.needsGeneration).length,
      manualReview: rows.filter((row) =>
        row.flags.includes("PUBLICATION_REVIEW_REQUIRED"),
      ).length,
    };
    const duplicateMediaClusters = [...clusters]
      .filter(
        ([, group]) =>
          group.length > 1 &&
          group.some(
            (row) => !categorySlug || row.category?.slug === categorySlug,
          ),
      )
      .map(([key, group]) => ({
        key,
        productSlugs: group.map((row) => row.slug),
      }));
    let proposedProducts: Record<string, unknown>[] = [];
    try {
      const plan = JSON.parse(
        await readFile(
          join(root, "docs/catalogue-iphones-gadgets-plan.json"),
          "utf8",
        ),
      ) as {
        category: { slug: string };
        products: { proposedName: string; mediaStrategy: string }[];
      };
      if (!categorySlug || categorySlug === plan.category.slug)
        proposedProducts = plan.products.map((proposal) => ({
          ...proposal,
          existingConceptSlugs: products
            .filter(
              (product) =>
                conceptIdentity(product.name) ===
                conceptIdentity(proposal.proposedName),
            )
            .map((product) => product.slug),
          weakIdentity: weakProductIdentity(proposal.proposedName),
          mediaRequired: true,
          publicationApproved: false,
          validationStatus: weakProductIdentity(proposal.proposedName)
            ? "REJECT_WEAK_IDENTITY"
            : proposal.mediaStrategy === "current_product_research"
              ? "CURRENT_PRODUCT_RESEARCH"
              : "REQUIRES_DRAFT_RECONCILIATION_AND_MEDIA",
        }));
    } catch {
      /* proposals optional; existing product audit is still complete */
    }
    const report = {
      generatedAt: new Date().toISOString(),
      readOnly: true,
      category: categorySlug ?? "all",
      counts,
      countSemantics:
        "Issue counts overlap; each product can fail more than one gate.",
      categories,
      proposedProducts,
      duplicateMediaClusters,
      hashCoverage: {
        known: hashes.size,
        unknown: products.filter(
          (row) => primaryImage(row) && !hashes.has(row.id),
        ).length,
      },
      limitations: [
        "No machine vision provider was called. Missing explicit visual review fails closed.",
        "Near-identical re-encoded images need visual review; exact hashes do not prove perceptual uniqueness.",
        "Remote binaries without matching SHA provenance remain unverified.",
      ],
      products: rows,
      commodities: commodityReview,
    };
    const md = [
      "# Product publication validation",
      "",
      `Category: ${categorySlug ?? "all"}. Read-only audit. Existing Ops records are unchanged.`,
      "",
      "Issue counts overlap.",
      "",
      ...Object.entries(counts).map(([key, value]) => `- ${key}: ${value}`),
      "",
      "| Product | Public result | Reasons |",
      "| --- | --- | --- |",
      ...rows.map(
        (row) =>
          `| ${row.productName.replaceAll("|", "/")} | ${row.publicStatus} | ${row.flags.join(", ")} |`,
      ),
      "",
      "## Media clusters",
      ...duplicateMediaClusters.map(
        (cluster) => `- ${cluster.key}: ${cluster.productSlugs.join(", ")}`,
      ),
      "",
      "## Commodities",
      ...commodityReview.map(
        (row) =>
          `- ${row.name}: ${row.route}; ${row.mediaSemanticStatus}; duplicates: ${row.duplicateSlugs.join(", ") || "none"}`,
      ),
      "",
      "Visual relevance is not inferred from filenames, alt text, or a working URL. No review approval was invented.",
      "",
    ].join("\n");
    for (const [filename, contents] of [
      [
        "product-validation-report.json",
        JSON.stringify(report, null, 2) + "\n",
      ],
      ["product-validation-report.md", md],
    ]) {
      const target = join(root, "docs", filename!);
      await writeFile(`${target}.tmp`, contents!);
      await rename(`${target}.tmp`, target);
    }
    console.log(JSON.stringify(counts, null, 2));
    for (const row of rows.filter(
      (row) => row.publicStatus !== "PUBLIC_APPROVED",
    ))
      console.log(
        JSON.stringify({
          productName: row.productName,
          slug: row.slug,
          status: row.publicStatus,
          reasons: row.flags,
        }),
      );
    console.log("Audit complete. No product or commodity records changed.");
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Catalogue validation failed. Check database connectivity/configuration. No data was mutated; existing reports are retained until a successful audit.",
  );
  process.exitCode = 1;
});
