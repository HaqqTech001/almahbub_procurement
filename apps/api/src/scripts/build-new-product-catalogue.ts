import "../load-env.js";
import { readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabaseClient } from "@hamd/database";
import { parseEnvironment } from "../config/env.js";
import { proposalGroups } from "./new-catalogue-proposals.js";
import {
  validateProposals,
  type Proposal,
  type ExistingIdentity,
} from "../modules/catalog/application/new-catalogue-plan.js";
const root = fileURLToPath(new URL("../../../..", import.meta.url));
async function main() {
  if (process.argv.slice(2).length)
    throw new Error(
      "Planning is read-only. This command does not accept execution or import flags.",
    );
  const env = parseEnvironment(process.env);
  if (!env.DATABASE_URL)
    throw new Error(
      "Database is not configured; previous plans remain unchanged.",
    );
  const db = createDatabaseClient(env.DATABASE_URL);
  try {
    await db.$queryRaw`SELECT 1`;
    const categories = await db.productCategory.findMany({
      select: { id: true, slug: true, name: true, status: true },
      orderBy: { slug: "asc" },
    });
    if (!categories.length)
      throw new Error(
        "No categories were found; previous plans remain unchanged.",
      );
    const existing: ExistingIdentity[] = [];
    const media: {
      productId: string;
      storageKey: string | null;
      url: string;
    }[] = [];
    let cursor: string | undefined;
    for (;;) {
      const rows = await db.product.findMany({
        orderBy: { id: "asc" },
        take: 100,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          name: true,
          slug: true,
          brand: { select: { name: true } },
          images: { select: { storageKey: true, url: true } },
        },
      });
      existing.push(...rows);
      for (const row of rows)
        for (const image of row.images)
          media.push({ productId: row.id, ...image });
      console.log(`Compared ${existing.length} existing product identities`);
      if (rows.length < 100) break;
      cursor = rows.at(-1)!.id;
    }
    const proposals: Proposal[] = proposalGroups.flatMap((group) => {
      const categorySlug =
        group.categorySlugs.find((slug) =>
          categories.some(
            (category) =>
              category.slug === slug && category.status === "published",
          ),
        ) ?? group.categorySlugs[0]!;
      return group.names.map((name, index) => ({
        proposedName: name,
        categorySlug,
        productFamily: name,
        group: group.key,
        context: group.context,
        priorityTier:
          index < 5 ? "P1_SHOWCASE" : index < 20 ? "P2_CORE" : "P3_EXPANSION",
      }));
    });
    const products = validateProposals(
      proposals,
      categories,
      existing,
      Object.fromEntries(
        proposalGroups.map((group) => [group.key, group.categorySlugs]),
      ),
    );
    const countBy = (
      field: "validationStatus" | "mediaStrategy" | "priorityTier",
    ) =>
      Object.fromEntries(
        [...new Set(products.map((product) => product[field]))].map((value) => [
          value,
          products.filter((product) => product[field] === value).length,
        ]),
      );
    let provenance: { rows?: Record<string, unknown>[] } = {};
    try {
      provenance = JSON.parse(
        await readFile(
          join(root, "docs/generated-product-media-provenance.json"),
          "utf8",
        ),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new Error(
          "Generated media provenance could not be read; previous plans remain unchanged.",
        );
    }
    const mediaEvidence = media.map((image) => {
      const record = provenance.rows?.find(
        (row) =>
          row.productId === image.productId &&
          (row.storageKey === image.storageKey ||
            row.newStorageKey === image.storageKey ||
            row.mediaUrl === image.url ||
            row.newMediaUrl === image.url),
      );
      return {
        ...image,
        sha256:
          typeof record?.sha256 === "string"
            ? record.sha256
            : typeof record?.newSha256 === "string"
              ? record.newSha256
              : null,
        provenance: record
          ? "docs/generated-product-media-provenance.json"
          : null,
      };
    });
    const suspiciousMedia = mediaEvidence.filter((image, index, all) =>
      all.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.productId !== image.productId &&
          ((image.storageKey && other.storageKey === image.storageKey) ||
            other.url === image.url ||
            (image.sha256 && other.sha256 === image.sha256)),
      ),
    );
    const generatedAt = new Date().toISOString();
    const research = products
      .filter(
        (product) => product.validationStatus === "CURRENT_PRODUCT_RESEARCH",
      )
      .map((product) => ({
        proposedProductName: product.proposedName,
        brand: product.brand,
        familySeries: product.productFamily,
        category: product.category,
        exactModelVerificationRequired: true,
        officialSourceRequired: true,
        releaseStatusRequired: true,
        mediaSourceRequired: true,
        checkedAtRequired: true,
      }));
    const generation = products
      .filter(
        (product) =>
          product.validationStatus === "APPROVED_FOR_DRAFT" &&
          product.mediaStrategy === "generated_generic",
      )
      .map((product) => ({
        productName: product.proposedName,
        category: product.category,
        physicalIdentity: product.productFamily,
        importantVisualModifiers:
          product.proposedName.match(
            /front.load|deep.groove|tapered|spherical|hydraulic|pneumatic|cordless|leather|uv\/led|submersible|centrifugal|double|single|steel|glass/gi,
          ) ?? [],
        negativeConstraints: [
          "No invented brand, logo, text or exact-model representation",
          "No accessories or features not established by the product identity",
        ],
        priorityTier: product.priorityTier,
      }));
    const summary = {
      proposed: products.length,
      existingProductsCompared: existing.length,
      byValidationStatus: {
        APPROVED_FOR_DRAFT: 0, CURRENT_PRODUCT_RESEARCH: 0, MANUAL_REVIEW: 0,
        REJECT_DUPLICATE: 0, REJECT_WEAK_IDENTITY: 0, REJECT_CATEGORY_MISMATCH: 0,
        ...countBy("validationStatus"),
      },
      byStrategy: countBy("mediaStrategy"),
      byPriority: countBy("priorityTier"),
      currentProductResearch: research.length,
      genericGeneration: generation.length,
      suspiciousMediaRows: suspiciousMedia.length,
      mediaHashCoverage: { known: mediaEvidence.filter(image => image.sha256).length, unknown: mediaEvidence.filter(image => !image.sha256).length },
    };
    const plan = {
      generatedAt,
      status: "planning_only",
      mutationsPerformed: false,
      summary,
      categories: categories.map((category) => ({
        ...category,
        proposedCount: products.filter(
          (product) => product.categoryId === category.id,
        ).length,
      })),
      lifecycle: [
        "PROPOSED",
        "VALIDATED",
        "DRAFT_CREATED",
        "MEDIA_STRATEGY_ASSIGNED",
        "MEDIA_ACQUIRED",
        "MEDIA_VALIDATED",
        "PRIMARY_IMAGE_CREATED",
        "FINAL_REVIEW",
        "PUBLISHED",
      ],
      publicationGate:
        "Explicit human approval, correct category, duplicate review and validated primary media are required. This command cannot create or publish records.",
      schemaNotes:
        "Product.status is the existing publication boundary. Proposal validation and research evidence live in this review plan; Product has no separate approval/model/family fields. Existing media hashes are reported only when provenance supplies them.",
      products,
      suspiciousMedia,
    };
    const markdown = `# New product catalogue plan\n\nGenerated ${generatedAt}. Planning only; no database mutations.\n\n${JSON.stringify(summary, null, 2)}\n\n## Existing categories\n\n${plan.categories.map((category) => `- ${category.name} (${category.slug}): ${category.proposedCount} proposals`).join("\n")}\n\n## Review requirements\n\nExisting records were compared, including archived/draft identities. A rejected proposal is not a recommendation to delete the existing product. Reuse or review existing records. Branded families are research requests, not verified current models. No image generation is authorized by this plan. Final publication requires human review and valid media.\n\n## Proposals\n\n| Name | Category | Priority | Strategy | Validation |\n| --- | --- | --- | --- | --- |\n${products.map((product) => `| ${product.proposedName} | ${product.categorySlug} | ${product.priorityTier} | ${product.mediaStrategy} | ${product.validationStatus} |`).join("\n")}\n`;
    for (const [filename, content] of [
      ["new-product-catalogue-plan.json", JSON.stringify(plan, null, 2)],
      ["new-product-catalogue-plan.md", markdown],
      [
        "current-product-research-queue.json",
        JSON.stringify({ generatedAt, products: research }, null, 2),
      ],
      [
        "generic-product-generation-queue.json",
        JSON.stringify({ generatedAt, products: generation }, null, 2),
      ],
    ]) {
      const target = join(root, "docs", filename!);
      await writeFile(`${target}.tmp`, content!, "utf8");
      await rename(`${target}.tmp`, target);
    }
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Catalogue planning failed. Check API database connectivity and planning inputs. No database records were changed.",
  );
  process.exitCode = 1;
});
