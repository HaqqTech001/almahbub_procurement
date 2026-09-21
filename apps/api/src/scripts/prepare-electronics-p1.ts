import "../load-env.js";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createDatabaseClient, type Prisma } from "@hamd/database";
import { parseEnvironment } from "../config/env.js";
import {
  normalizedIdentity,
  slugify,
} from "../modules/catalog/application/new-catalogue-plan.js";
import { weakProductIdentity } from "../modules/catalog/application/product-publication-review.js";
const root = fileURLToPath(new URL("../../../..", import.meta.url));
type Proposal = {
  proposedName: string;
  priorityTier: string;
  mediaStrategy: string;
  shortDescription: string;
  notes: string;
};
type Research = {
  proposedName: string;
  verifiedName: string;
  brand: string;
  model: string;
  officialSourceUrl: string;
  checkedAt: string;
  catalogueDecision: string;
  shortDescription: string;
  description: string;
  slug: string;
};
async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--execute") || args.length > 1)
    throw new Error("Only --execute is supported. P1 scope is fixed.");
  const execute = args.includes("--execute");
  const plan = JSON.parse(
    await readFile(
      join(root, "docs/catalogue-iphones-gadgets-plan.json"),
      "utf8",
    ),
  ) as { category: { id: string; slug: string }; products: Proposal[] };
  const research = JSON.parse(
    await readFile(
      join(root, "docs/electronics-current-product-research-results.json"),
      "utf8",
    ),
  ) as { products: Research[] };
  const proposals = plan.products.filter(
    (row) => row.priorityTier === "P1_SHOWCASE",
  );
  if (
    plan.products.length !== 30 ||
    proposals.length !== 12 ||
    plan.category.slug !== "iphones-gadgets"
  )
    throw new Error("Plan scope changed; review required.");
  const env = parseEnvironment(process.env);
  if (!env.DATABASE_URL) throw new Error("Database is not configured.");
  const db = createDatabaseClient(env.DATABASE_URL);
  const results: Record<string, unknown>[] = [];
  try {
    const category = await db.productCategory.findUnique({
      where: { id: plan.category.id },
    });
    if (
      !category ||
      category.slug !== plan.category.slug ||
      category.status !== "published"
    )
      throw new Error("Category identity changed.");
    const identities: { id: string; name: string; slug: string }[] = [];
    let cursor: string | undefined;
    for (;;) {
      const batch = await db.product.findMany({
        select: { id: true, name: true, slug: true },
        take: 100,
        orderBy: { id: "asc" },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      identities.push(...batch);
      if (batch.length < 100) break;
      cursor = batch.at(-1)!.id;
    }
    for (const proposal of proposals) {
      const evidence = research.products.find(
        (row) => row.proposedName === proposal.proposedName,
      );
      const branded = proposal.mediaStrategy === "current_product_research";
      if (
        branded &&
        (!evidence ||
          evidence.catalogueDecision !== "APPROVED_FOR_DRAFT" ||
          !evidence.model ||
          !/^https:\/\/(?:[^/]+\.)?(?:apple\.com|samsung\.com|samsungmobilepress\.com|google\.com)\//.test(
            evidence.officialSourceUrl,
          ) ||
          !Number.isFinite(Date.parse(evidence.checkedAt)))
      ) {
        results.push({
          proposedName: proposal.proposedName,
          status: "RESEARCH_BLOCKED",
        });
        continue;
      }
      const name = branded ? evidence!.verifiedName : proposal.proposedName;
      if (weakProductIdentity(name) || /\u2014/.test(name))
        throw new Error("Weak product identity refused.");
      const slug = branded ? evidence!.slug : `electronics-${slugify(name)}`;
      const existing = await db.product.findUnique({
        where: { slug },
        include: { variants: true },
      });
      if (existing) {
        const metadata = existing.variants[0]?.specifications as Record<
          string,
          unknown
        > | null;
        if (
          existing.name !== name ||
          existing.categoryId !== category.id ||
          metadata?.catalogueWorkflow !== "electronics-p1-v1"
        )
          throw new Error(
            "Existing identity conflict; no overwrite performed.",
          );
        results.push({
          proposedName: proposal.proposedName,
          productId: existing.id,
          name,
          slug,
          status: "kept_existing",
          publicationStatus: existing.status,
        });
        continue;
      }
      const duplicate = identities.find(
        (row) => normalizedIdentity(row.name) === normalizedIdentity(name),
      );
      if (duplicate) {
        results.push({
          proposedName: proposal.proposedName,
          name,
          slug,
          status: "REJECT_DUPLICATE",
          duplicateSlug: duplicate.slug,
        });
        continue;
      }
      const shortDescription = branded
        ? evidence!.shortDescription
        : `${name} for practical mobile-device use, with requirements confirmed during enquiry.`;
      const description = branded
        ? evidence!.description
        : `${shortDescription} Representative generic product identity, without a brand or exact-model claim. Capacity, power profile, regional connector requirements and intended use are confirmed before sourcing. No stock, warranty, price or delivery period is promised.`;
      const specs = {
        catalogueWorkflow: "electronics-p1-v1",
        proposedName: proposal.proposedName,
        categoryId: category.id,
        categorySlug: category.slug,
        priorityTier: proposal.priorityTier,
        shortDescription,
        exactModel: branded ? evidence!.model : null,
        mediaStrategy: proposal.mediaStrategy,
        identityStatus: "approved",
        validationStatus: "APPROVED_FOR_DRAFT",
        publicationStatus: "draft",
        research: branded ? evidence : null,
        approvedAt: new Date().toISOString(),
      };
      if (!execute) {
        results.push({
          proposedName: proposal.proposedName,
          name,
          slug,
          status: "draft_ready",
          mediaStrategy: proposal.mediaStrategy,
          shortDescription,
        });
        continue;
      }
      const created = await db.product.create({
        data: {
          name,
          slug,
          category: { connect: { id: category.id } },
          status: "draft",
          description,
          ...(branded
            ? {
                brand: {
                  connectOrCreate: {
                    where: { slug: slugify(evidence!.brand) },
                    create: {
                      name: evidence!.brand,
                      slug: slugify(evidence!.brand),
                    },
                  },
                },
              }
            : {}),
          variants: {
            create: {
              name: "Standard sourcing",
              specifications: specs as unknown as Prisma.InputJsonValue,
            },
          },
        },
      });
      identities.push(created);
      results.push({
        proposedName: proposal.proposedName,
        productId: created.id,
        name,
        slug,
        status: "draft_created",
        publicationStatus: created.status,
        mediaStrategy: proposal.mediaStrategy,
      });
      console.log(JSON.stringify({ slug, status: "draft_created" }));
    }
    await writeFile(
      join(root, "docs/electronics-p1-draft-results.json"),
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          execute,
          storageDriver: env.CATALOG_MEDIA_DRIVER,
          generationProviderConfigured: Boolean(
            env.CATALOG_IMAGE_PROVIDER === "openai" && env.OPENAI_API_KEY,
          ),
          selected: proposals.length,
          results,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      JSON.stringify({ selected: proposals.length, execute, results }, null, 2),
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "P1 draft preparation failed; inspect identity/plan/database configuration. No existing products were overwritten.",
  );
  process.exitCode = 1;
});
