# Almahbub International V2 Expanded Procurement Catalogue

## Package contents

- `expanded-catalogue.ts` - 10 refined categories and 1,000 database-ready product definitions.
- `expanded-catalogue.json` - the same catalogue in reviewable JSON.
- `seed-expanded-catalogue.ts` - safe raw-pg seed adapter that upserts by slug and resolves the real product UUID before writing the variant.
- `product-media-plan.json` - planned media metadata for 3 images and 1 MP4 overview per product. These are target filenames, not fake media binaries.
- `category-media-plan.json` - one category image target per existing category.
- `category-image-prompts.md` - professional image-generation/source briefs for the 10 category images.
- `validation-report.json` - catalogue integrity checks.

## Catalogue size

- Categories: 10
- Products: 1,000
- Products in each category: 100
- Planned product images: 3,000
- Planned product videos: 1,000
- Planned category images: 10

## Why the seed adapter does not replace existing product UUIDs

The current database already has 127 seeded published products with stable UUIDs. A new fixed ID assigned to a slug that
already exists could conflict with the row retained by `ON CONFLICT (slug)`. The supplied adapter therefore:

1. preserves the existing category UUIDs and slugs;
2. upserts each Product by its unique CITEXT slug;
3. uses `RETURNING id` to obtain the actual Product UUID in the current database;
4. updates the existing `Standard sourcing` variant when present, or inserts it when absent.

This makes the expansion safer to merge into the current development seed.

## Important current-schema limitations respected

The generated catalogue does not invent database fields for:
- price or currency;
- physical stock;
- featured state;
- lead time;
- Product-level unit;
- Product-level origin;
- tags or keywords.

`unit`, `typicalSpecificationFields` and `sourcingStatus` live inside `ProductVariant.specifications`, exactly as the current seed contract permits.

Products are described as available for procurement/sourcing. The dataset does not claim Almahbub physically warehouses every listed item.

## Media

### Active first-wave priority queue

`../almahbub-beta-media-runner/beta-product-media-manifest.json` now ranks 250 existing generic product identities. Use its `globalPriority` order, not alphabetical order or the order of `product-media-plan.json`.

- `current-product-research.json` contains separate, unverified branded-family research tasks. They are not catalogue rows or generation jobs.
- `priority-media-requested-coverage.json` preserves all 14 requested product groups and records taxonomy/product gaps.
- `high-priority-media-queue.md` explains selection, exclusions, coverage and the ranked first wave.
- Run `python scripts/update-priority-media-queue.py` from the repository root to rebuild the generic queue deterministically. It does not contact services or import media.

No POS terminals or fabric products are in the first wave. `generation_ready` means ready for a generic imagery brief, subject to physical-identity confirmation and review; it does not mean files exist, images are approved, or products are live in the database. Preserve real model identity and existing categories when resolving gaps.

The catalogue package deliberately does not create fake product image/video binaries.

`product-media-plan.json` gives a clean target naming convention and metadata for every product:
- `<product-slug>-primary.webp`
- `<product-slug>-detail.webp`
- `<product-slug>-application.webp`
- `<product-slug>-overview.mp4`

Once real, owner-approved, manufacturer-approved, properly licensed or intentionally generated media exists, those files can
be mapped through the repository's existing `import-catalog-media.ts` mechanism.

For visual image previews in the app, raw filenames do not need to be shown to customers/admins.

## Recommended integration in Cursor

1. Put `expanded-catalogue.ts` and `seed-expanded-catalogue.ts` under `database/prisma/seed/`.
2. Call `seedExpandedProcurementCatalogue(...)` from the same seed transaction/client used by `development.ts`.
3. Keep the existing draft sample handling separate.
4. Run the database seed tests.
5. Run the seed twice and verify it is idempotent.
6. Query category counts and verify each of these ten category slugs has at least 100 published Products.
7. Verify buyer `GET /api/v1/products?q=` can find catalogue entries by Product name, description and category.
8. Do not auto-import planned media entries until the corresponding files actually exist.

## Search

Descriptions intentionally include useful category/use wording because the current buyer search only checks:
- Product name;
- Product description;
- Category name.

It does not search variant JSON, SKU, brand, manufacturer or media metadata.
