# Catalogue navigation and planning implementation

## Delivered flows

- Homepage procurement cards use published database categories, their IDs/slugs and assigned media. No static category fallback or homepage product rows.
- Category route: `/global-procurement/category/:slug`.
- One `GET /api/v1/categories/:slug` returns stored category metadata plus a bounded preview. The database requests at most 16 published products in the resolved category ID, ordered by name and slug, with an assigned primary image. Media checks have concurrency limited to eight. Invalid media, recognized category mismatches, filler/research names, duplicate normalized identities and reused image URLs within the preview are excluded. Fewer than 16 cards is valid; the endpoint does not scan the whole category to backfill rejected candidates.
- Product links preserve `/product/:slug`. View More Products preserves `/products?category=<slug>`, including existing search/filter/sort/pagination behavior. Existing product/category query URLs remain intact.
- Homepage commodities come exclusively from published API records, paged in batches of 100. Commodity routes remain `/businesses/almahbub-integrated-export/commodities/:slug`.
- Commodity details use stored text/media and omit absent optional fields. Static publication and slug-based artwork substitution were removed. Request Export Supply preserves `ieCommodity=<slug>` into the request flow, including the login return URL.
- No source assets were removed, no product records were inserted or mutated, and no images were generated.

## Planning output

Run `pnpm catalogue:plan-new`. This command is read-only, uses API environment/database initialization, compares existing identities in deterministic batches of 100, and rejects execution/import flags. Creation remains a separate future approved-input step.

Discovered 10 published categories and 7 published commodities. The connected database still has 1,122 products, with 1,073 published. Existing identities are not restored or removed by the planner.

| Existing category slug | Proposed products |
| --- | ---: |
| beauty-spa-salon | 16 |
| fashion-textiles | 48 |
| general-procurement | 0 |
| home-appliances | 24 |
| home-garden-wares | 0 |
| iphones-gadgets | 15 |
| machineries | 71 |
| medical-equipments | 16 |
| office-business | 25 |
| retail-store-setup | 0 |

There are no separate footwear or spare-parts categories in this database. The plan uses the existing fashion and machinery categories. P1 is balanced by the ten commercial priority groups, five proposals each.

| Validation status | Count |
| --- | ---: |
| APPROVED_FOR_DRAFT | 150 |
| CURRENT_PRODUCT_RESEARCH | 13 |
| MANUAL_REVIEW | 20 |
| REJECT_DUPLICATE | 32 |
| REJECT_WEAK_IDENTITY | 0 |
| REJECT_CATEGORY_MISMATCH | 0 |

Total: 215. P1_SHOWCASE: 50; P2_CORE: 125; P3_EXPANSION: 40. Research queue: 13. Generic generation queue: 150. Rejected duplicates are excluded from execution queues. No current-model verification results or media rights were invented.

Generated/replaced planning files:

- `docs/new-product-catalogue-plan.json`
- `docs/new-product-catalogue-plan.md`
- `docs/current-product-research-queue.json`
- `docs/generic-product-generation-queue.json`

## Verification

- API typecheck passed.
- Web typecheck and production build passed.
- API catalogue tests: 21 passed.
- Web catalogue/navigation/commodity/copy tests: 31 passed.
- Actual browser checks used a local GET-only server with the real catalogue services and database. Three categories (salon, appliances, machinery) and three commodities (sesame, cashew, ginger) passed at 1440, 768 and 390 pixels with no horizontal overflow.
- Preview counts after eligibility filters: 14 salon, 7 appliances, 2 machinery. Product-detail navigation and View More category preservation passed.
- Stored commodity images decoded successfully. Request links retained commodity selection through login. No requests were submitted.
- The live office-category empty state passed. Missing optional commodity fields are covered by tests.
- Stored sesame/shea descriptions contained U+2014; display-only punctuation normalization now preserves their meaning without that character. Database content was not modified.
- The full application's shared API rate limit interrupted the first repeated browser run. Final repeated tests used isolated GET-only routes, without changing production rate limits or running workers/bootstrap.

## Limitations and approval boundaries

The existing schema represents final publication with `Product.status = published`; it does not contain an independent editorial approval or research-completion field. The preview preserves that existing boundary and applies additional conservative checks. It cannot prove that every legacy published row received human review. Proposal validation is heuristic and approval for a draft is not approval to generate, import or publish.

Only one existing image had SHA-256 provenance; 258 had no recorded hash. No repeated keys/URLs/known hashes were found, but binary duplication cannot be ruled out for those 258 images. No binaries were downloaded or regenerated for this audit. New generation must retain the existing SHA-256 and governed-storage safeguards.

The 215-product plan requires review before any approved-input creation/import workflow. Branded products remain research-only. No commit or push was performed.

## Source files changed for this task

API:

- `apps/api/src/modules/catalog/api/catalog-controller.ts`
- `apps/api/src/modules/catalog/api/catalog-routes.ts`
- `apps/api/src/modules/catalog/application/catalog-policy.ts`
- `apps/api/src/modules/catalog/application/catalog-service.ts`
- `apps/api/src/modules/catalog/application/new-catalogue-plan.ts`
- `apps/api/src/modules/catalog/tests/catalog-service.test.ts`
- `apps/api/src/modules/catalog/tests/category-preview.test.ts`
- `apps/api/src/modules/catalog/tests/new-catalogue-plan.test.ts`
- `apps/api/src/scripts/build-new-product-catalogue.ts`
- `apps/api/src/scripts/new-catalogue-proposals.ts`

Web:

- `apps/web/src/App.tsx`
- `apps/web/src/api/catalog-api.ts`
- `apps/web/src/components/CommerceCatalogue.tsx`
- `apps/web/src/pages/ProcurementCategoryPage.tsx`
- `apps/web/src/pages/ProcurementCategoryPage.test.tsx`
- `apps/web/src/pages/HomePage.test.tsx`
- `apps/web/src/pages/ProductsPage.test.tsx`
- `apps/web/src/styles/commerce.css`
- `apps/web/src/lib/catalogue-copy.ts`
- `apps/web/src/lib/catalogue-copy.test.ts`
- `apps/web/src/integrated-export/IeCommodityImage.tsx`
- `apps/web/src/integrated-export/commodities/ie-commodity-api.ts`
- `apps/web/src/integrated-export/commodities/ie-commodity-api.test.tsx`
- `apps/web/src/integrated-export/commodities/map-ie-commodity.ts`
- `apps/web/src/integrated-export/commodities/use-published-ie-catalogue.ts`
- `apps/web/src/integrated-export/pages/IeCommoditiesPage.tsx`
- `apps/web/src/integrated-export/pages/IeCommodityDetailPage.tsx`
- `apps/web/src/integrated-export/pages/IeCommodityDetailView.tsx`
- `apps/web/src/integrated-export/pages/IeCommodityPages.test.tsx`

Root `package.json` adds `catalogue:plan-new`. Other pre-existing repository changes were preserved. Browser evidence screenshots are under `docs/catalogue-commodity-*.png`.
