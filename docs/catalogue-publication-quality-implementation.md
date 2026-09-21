# Catalogue publication quality: implementation and audit

## Result

Public product listings, category previews and direct details now require explicit reviewed release data. Database `published` alone is insufficient. No existing product has the new review evidence, so all unreviewed products are hidden by the API. This changes public visibility only; no Product, ProductImage, category or commodity database rows were mutated. Deployment is not performed by this task.

## Phones/gadgets findings

| Measure | Count |
| --- | ---: |
| total | 114 |
| publicApproved | 0 |
| hiddenWeakIdentity | 5 |
| hiddenDuplicate | 7 |
| hiddenDuplicateMedia | 16 |
| hiddenBadMedia | 99 |
| needsResearch | 0 |
| needsGeneration | 80 |
| manualReview | 114 |

Issue counts overlap. `needsGeneration` is a candidate repair signal, not generation approval. `manualReview` includes every row without a complete publication review.

5G Smartphone, Enterprise Smartphone, Premium Smartphone and Rugged Smartphone are all hidden for weak identity, conceptual duplication, duplicate media and bad media. Their four different files have exactly the same SHA-256: `c04f15b5198b50edd9c3715e17c64ac4d569abb4c6aef952b99176f45c083143`.

Actual visual inspection shows an abacus and laptop scene with a small older phone in the background. It is not a product-focused modern smartphone image. The hash is recorded as rejected; a successful download or matching alt text cannot override that decision.

Four target-category binary clusters: smartphones (4), USB hubs (5), surveillance cameras (5), external drives (2). Distinct filenames/storage keys had concealed exact binary reuse. No category hero reuse was detected by URL, key or computed local category-image hash.

Across all categories: 1122 records; 25 binary clusters affecting 157 products. Hashes were available for all 219 selected primary-image records. Records without a primary image remain hidden. Perceptual similarity after re-encoding is not established by exact hashing.

## Category identity

The database category is `Electronics, Mobile & Digital Technology`, ID `0190c8a0-1000-7000-8000-000000000001`, with legacy slug `iphones-gadgets`. The displayed heading uses that real record. Its description includes computers and networking, so those are not automatically treated as mismatches solely because the old slug says phones.

Recommend `electronics-mobile-digital-technology` if keeping the broad category. A future approved migration should redirect the old URL permanently and update links. No slug or taxonomy was changed. A phones-only category would require a separate deliberate taxonomy decision.

The assigned category hero depicts a broad electronics assortment and remains category artwork only. It is not approved as an individual product image.

## Publication mechanism

- `product-publication-review.ts` contains the typed reviewed-release registry. It starts empty; no approval has been invented.
- No database migration or extra status fields are added. Ops retains its existing editing and publication-state controls. An Ops status change cannot bypass the additional public review gate.
- Every review requires the five requested statuses, commercial relevance, reviewer, timestamp, media identity, visual evidence, source and rights, primary image ID and SHA-256, plus a fingerprint of product/category/primary-media identity.
- Exact branded identities require manufacturer/model/generation/market-status/official-source research evidence. Family research entries in the plan are not publication records.
- To approve later, reconcile duplicate concepts, inspect the actual binary and license, validate category and current branded identity where relevant, then submit a reviewed registry record using the validator fingerprint. Review records are maintained through code review and deployment; this task does not add an Ops approval editor.
- Public reads compare fingerprints and actual image hashes. Changing name, description, category, image association or binary invalidates approval. Binary checks have a maximum 30-second cache window; media objects should retain immutable storage keys.
- Remote hashing is bounded to 20 MB with time limits, validated/pinned public IPv4 DNS, no credentials and at most three redirects. Local hashing uses governed UUID paths. No paid provider is used.
- Media associations are checked outside the preview across products, including unreviewed records. SHA conflicts across approval records are rejected unless both reviews explicitly approve sharing the same physical model. The validator additionally detects copied binaries under different keys across the complete catalogue.
- Only the reviewed primary image is returned publicly; unreviewed legacy gallery images are not implicitly approved.
- Category candidates come only from the approval registry, in pages of at most 100, ranked P1 then P2 then P3 with deterministic slug order. Invalid candidates do not consume the 16-card allowance. Empty categories show Engage in Global Procurement.

## New category plan

30 proposals; 12 P1 showcase; 20 research-only branded entries; 10 generic accessories; 0 separate manual-review proposals.

See `catalogue-iphones-gadgets-plan.json` and `.md` for names, descriptions, strategies, duplicate risks, Apple generation coverage, official-source checks and unresolved Samsung/other family research. No models were inserted and no images were acquired/generated. Generic accessory concepts must be reconciled with retained legacy records before creating anything.

## Validation tooling and outputs

- `pnpm catalogue:validate`: all-category read-only audit, shared API environment and database factory, identity pages of 100, at most eight media checks at once, Prisma disconnect in finally.
- `pnpm catalogue:validate --category=iphones-gadgets`: target-category results while checking image and identity associations against the whole catalogue.
- No execute/delete/archive/publish mode. Unsupported options fail. Reports are written only after queries/checks finish; database errors do not create an empty success report.
- Main outputs: `product-validation-report.json` and `.md` (latest run: all categories).
- Saved target snapshot: `product-validation-iphones-gadgets.json` and `.md`. Every problematic product is listed, with flags and associations. New proposals are included separately and never counted as existing products.

## Commodity review

Seven real IntegratedExportCommodity CMS rows were inspected separately from products. All seven identities and descriptions refer to legitimate commodities; their stored routes remain distinct and request selection behavior is unchanged. No duplicate commodity identities or hero URLs were found.

- Cashew: rejected. Mixed nuts and dried-fruit mixture, not isolated cashew kernels. Misleading hero for this commodity.
- Cocoa: rejected. Image renders with severe dark/red blocks and does not provide a clear cocoa subject. Replace after source and decoder review.
- Ginger: visually_consistent. Fresh ginger rhizomes are clearly visible; description permits fresh or dried form.
- Hibiscus: visually_consistent. Red calyces and harvested stems visible; title and description refer to hibiscus. Cleaner commodity-focused image recommended.
- Sesame Seeds: visually_consistent. Small pale sesame seeds on a spoon are consistent with the commodity and seed description.
- Shea: manual_review. Reddish nuts with dark fibrous patches; botanical identity is not confidently confirmed as shea. Require verified source identification.
- Soybean: visually_consistent. Pale rounded seeds with visible hilum are consistent with soybean imagery and seed description.

These are hash-bound visual observations, not fabricated CMS values or automatic licensing approvals. Cashew and Cocoa need replacement images; Shea needs source identification. Commodity publication flags and assets were not changed by this product-publication patch. Consequently those existing commodity-media defects remain until corrected through the separate CMS workflow. No substitute generated product records or fallback art was inserted.

## Verification

- API TypeScript typecheck passed.
- Changed API files lint passed.
- API focused tests: 30 passed across four files. Includes absent/stale approvals, branded research, category-art rejection, cross-product reuse, same-URL binary replacement, P1 ranking, backfilling past 100 invalid reviewed candidates and 16-card cap.
- Web typecheck and production build passed.
- Web catalogue/category/commodity tests: 23 passed across four files.
- Browser acceptance at 1440 and 390 pixels used actual catalogue services/database through a local GET-only server. Correct heading, zero weak/filler cards, sourcing CTA, no horizontal overflow. The full listing was empty and direct weak-product detail returned 404.
- Screenshots: `catalogue-publication-gate-1440.png` and `catalogue-publication-gate-390.png`.
- No secret/env changes, paid media calls, database insertion/deletion/archival, commit or push.

## Files changed in this task

API:

- `apps/api/src/modules/catalog/application/catalog-service.ts`
- `apps/api/src/modules/catalog/application/product-publication-review.ts`
- `apps/api/src/modules/catalog/application/commodity-visual-observations.ts`
- `apps/api/src/modules/catalog/infrastructure/reviewed-media-hash.ts`
- `apps/api/src/modules/catalog/tests/catalog-service.test.ts`
- `apps/api/src/modules/catalog/tests/category-preview.test.ts`
- `apps/api/src/modules/catalog/tests/publication-fixtures.ts`
- `apps/api/src/modules/catalog/tests/reviewed-media-hash.test.ts`
- `apps/api/src/scripts/validate-product-catalogue.ts`

Web/root:

- `apps/web/src/pages/ProcurementCategoryPage.tsx`
- `apps/web/src/pages/ProcurementCategoryPage.test.tsx`
- `package.json` adds `catalogue:validate`.

Documentation outputs and screenshots are listed above. Earlier unrelated workspace changes were preserved.
