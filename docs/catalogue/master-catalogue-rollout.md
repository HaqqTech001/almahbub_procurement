# Master Catalogue V2 rollout and validation

This guide applies to the draft branch chatgpt/catalogue-manifest-mapper-hamd before merge into hamd.

## 1. Toolchain

The repository requires Node 24.11.1 (.nvmrc) and pnpm 10.14.x.

PowerShell:
    node --version
    corepack enable
    corepack prepare pnpm@10.14.0 --activate
    pnpm --version

## 2. Install and generate Prisma

    pnpm install --frozen-lockfile
    pnpm db:generate

Stop if Prisma generation fails.

## 3. Focused validation

    pnpm --filter @hamd/database validate
    pnpm --filter @hamd/database exec vitest run prisma/seed/map-master-catalogue.test.ts prisma/seed/seed-master-catalogue.test.ts prisma/seed/master-catalogue-content.test.ts
    pnpm --filter @hamd/api exec vitest run src/modules/catalog/application/master-catalogue-media-policy.test.ts src/modules/catalog/application/manufacturer-media-candidate.test.ts src/modules/catalog/tests/catalog-service.test.ts src/modules/ops/api/ops-schemas.test.ts
    pnpm --filter @hamd/ops exec vitest run src/modules/ProductFormPage.test.tsx
    pnpm --filter @hamd/web exec vitest run src/lib/catalog-display.test.ts

Then run the normal gates:
    pnpm format:check
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm build

Stop on any failure.

## 4. Manifest compatibility audit

    pnpm catalogue:map-master

Review docs/catalogue/reports/manifest-validation-report.json, catalogue-compatibility-report.md, and catalogue-mapping-report.json.

Current audited baseline: 100 entries, 94 create-as-new draft candidates, 6 manual-review mappings, and no mapped historical request/quotation references.

## 5. Recovery point

Create the normal database backup/recovery point before applying the migration.

## 6. Apply additive migration

Migration: database/prisma/migrations/20260921204000_master_catalogue_metadata/migration.sql

    pnpm db:migrate
    pnpm db:generate

The migration adds metadata enums/columns/indexes only. It does not archive or delete products.

## 7. Mandatory master seed dry-run

    pnpm catalogue:seed-master

Dry-run performs reads in a transaction and rolls back writes.

Review products to create, master-owned updates, manufacturers, variant rows, and Legacy slug collisions.

Legacy collision rule: only a row already carrying the same catalogueId can be updated. A legacy row with the same slug but no matching catalogueId is never adopted automatically.

If Legacy slug collisions is greater than zero, do not execute. Review each collision explicitly.

## 8. Execute seed only after dry-run approval

    pnpm catalogue:seed-master -- --execute

Expected: new master entries are drafts; families create ProductVariant rows; services use Sourcing request; configurable items use Configured to request; unowned legacy rows, requests, and quotations stay untouched; existing master-owned lifecycle values are preserved on reseed.

## 9. Ops/public validation

Verify Master catalogue ID, entry type, availability, summary, manufacturer source, release date, variants, verification state, media lifecycle, hero-image policy, and manifest version in Ops.

Public visibility still requires published status plus current publication review plus approved/reachable reviewed primary media. Status alone must not bypass review.

## 10. Media dry-run

    pnpm media:acquire -- --limit=100

The media pipeline is scoped to master-manifest entries, skips physical-product auto-images for services, requires human review for family hero images, prefers manufacturer-page candidates, and falls back to licensed Wikimedia/Openverse only for eligible exact/configurable items.

Review docs/product-media-provenance.json.

Manufacturer-page discovery is not usage-rights approval.

## 11. Publication

For approved media: copy to durable storage, verify binary/provenance, complete publication review, then publish.

For product families, approve a hero image that represents the series rather than only one sibling variant.

## 12. Legacy archive is a separate phase

Do not bulk-delete the old catalogue after seeding. Archive only after request/quotation regression checks, route/UI/Ops checks, master publication coverage, and a reversible archive mapping. Historical references must remain valid.
