# Safe V2 catalogue cleanup

This workflow never archives or deletes records automatically. It reads catalogue tables only, exports every product for review, and proposes classifications. Ops retains direct access to all statuses and products without media.

## Run from the repository root

```powershell
corepack pnpm --filter @hamd/constants build
if ($LASTEXITCODE -ne 0) { throw "Constants build failed" }
corepack pnpm --filter @hamd/api build
if ($LASTEXITCODE -ne 0) { throw "API build failed" }
node apps/api/src/scripts/export-catalogue-audit.mjs
if ($LASTEXITCODE -ne 0) { throw "Live snapshot unavailable; stop before auditing an older snapshot" }
node apps/api/src/scripts/audit-product-catalogue.mjs
```

The export uses the existing `apps/api/.env` connection without modifying it, starts a database-enforced `READ ONLY` transaction, and never starts the API/admin bootstrap. The audit script reads the local snapshot and checks media; it has no database client or write path.

Outputs under `database/audits/`:

- `catalogue-snapshot.local.json`: ignored raw catalogue-only snapshot, including media URLs. Do not publish it; URLs can contain signatures.
- `catalogue-audit.json` and `.csv`: every product, required identity/status/classification columns, media health and duplicate reference. No media URLs or credentials are exported to these reports.
- `catalogue-audit.md`: counts and up to five actual examples from each classification.

Check the snapshot timestamp before approving a cleanup. If snapshot acquisition fails, no live counts are available. Never substitute seed counts.

## Classification and approval

1. Explicit malformed/test/demo identities and exact duplicate identities become `DELETE_CANDIDATE` proposals. Similar titles alone do not establish duplicates: category, manufacturer, brand, description and variant specifications are compared. One original remains. Candidates still require a human check of product value, references and ownership; **none are confirmed safe deletions automatically**.
2. Existing archived records remain `ARCHIVE`. POS terminals, fabric rolls and clearly vague bundles are proposed for reversible archive. A missing image is not an archive/deletion reason.
3. Other useful products without verified primary media become `KEEP_NEEDS_MEDIA`, including phones, medical/lab equipment and salon equipment.
4. Remaining products with usable media become `KEEP_PRIORITY`. Unrecognized products are conservatively retained pending editorial review, not asserted to be trending or high quality.

Review all proposed archives and candidates first. Use existing Ops product status management to archive only approved records. Keep the exported product ID, prior status, reason and review decision so each change can be reversed. No bulk mutation command is provided. No migration is required.

Counts are deliberately separate: `archivedProducts` is the current database status count, while `proposedArchiveProducts` includes existing and proposed archives. Duplicate candidates are a subset of delete candidates. `KEEP_PRIORITY + KEEP_NEEDS_MEDIA + ARCHIVE + DELETE_CANDIDATE` equals total products. Broken/stale media counts include gallery rows; unverified network results are reported separately. Missing-media products include unverified primary media and must not be deleted for this reason.

## Public visibility

Public/buyer listing queries still require `published`. They check the first image by position before sorting/pagination and calculating totals. Existing name/newest/recommended sorts and category/search restrictions remain. Missing, stale, unsafe or unverified primary media excludes a product from public lists; Ops listing and direct product management do not use this filter.

Local catalogue files must exist under the configured upload root and have an image signature. Remote media requires a successful public GET, image MIME type and an image signature. Checks use bounded requests, DNS validation with pinned public IPv4 addresses, redirect validation, eight workers, and a 60-second URL cache. IPv6-only hosts, unsupported URL schemes/ports and transient provider errors remain unverified. Images supported by the existing upload policy are covered, plus remote AVIF. The initial uncached remote check may add latency proportional to the number of distinct image URLs; subsequent checks reuse the cache.

This is an availability/signature check, **not a full server image decode or an assessment of image quality/authenticity**. Browser load failure tries another assigned image and removes the card if none loads; it never leaves a large placeholder card in the public grid. Direct product details retain their accessible fallback. Published products return to lists after a valid primary image is uploaded and any cached result expires (up to 60 seconds). Local file checks describe the machine running the audit, not the contents of a separate production host's disk.

## Verification

```powershell
corepack pnpm --filter @hamd/api typecheck
corepack pnpm --filter @hamd/web typecheck
corepack pnpm --filter @hamd/api exec vitest run src/modules/catalog/tests/catalog-service.test.ts src/modules/catalog/tests/product-priority.test.ts src/modules/catalog/tests/catalogue-audit.test.ts src/modules/catalog/tests/product-media-health.test.ts
corepack pnpm --filter @hamd/web exec vitest run src/components/PublicProductCard.media.test.tsx
git diff --check
```
