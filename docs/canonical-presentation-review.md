# Canonical presentation visual consistency review

Implemented locally. No commit, push, deploy, .env change, hosted Supabase operation or migration was performed. Pre-existing API startup edits are preserved and are outside this change.

## Evidence limits

The preferred International files were located through catalogue-package/category-media-plan.json and the matching files on local API storage, then visually inspected as a contact sheet. These are recovered preferred localhost artwork, not a fresh observation of a running localhost API/database. No live production origin or database image URL was reverified in this task. ?Old source? below describes the previous resolver and its exact static default, not a claimed current production network capture. Full local filenames, candidate URLs and measurements are in canonical-presentation-assets.json.

Before this change, an absolute persistent API image won whenever supplied, including semantically stale HTTP-200 images. Missing or legacy /api/v1/public/catalog-media URLs used the old static default. The first five International defaults differed from the curated local PNGs. The new resolver does not fetch an override before canonical artwork.

## A. International

For every row, old production behavior was API imageUrl if persistent, otherwise the listed old static default; live production source remains unverified.

| Category | Old static default (after API override) | Preferred local source | Final canonical source | Optimized bytes | Status |
|---|---|---|---|---:|---|
| Electronics, Mobile & Digital Technology | `/media/international/category-iphones-gadgets.jpg` | `apps/api/uploads/public/catalog/0190c8a0-1000-7000-8000-000000000001/39f5e29c-d06c-486a-9f98-5cacad73dae6-electronics-mobile-digital-technology-category.png` | `/media/presentation/v2/international/iphones-gadgets.webp` | 43,994 | Curated source visually checked; canonical override regression passes |
| Medical, Healthcare & Laboratory Equipment | `/media/international/category-medical-equipments.jpg` | `apps/api/uploads/public/catalog/0190c8a0-1000-7000-8000-000000000002/ad3d6f5f-87c1-4a0e-8740-b18834f08701-medical-healthcare-laboratory-equipment-category.png` | `/media/presentation/v2/international/medical-equipments.webp` | 41,084 | Curated source visually checked; canonical override regression passes |
| Home, Garden & Facility Supplies | `/media/international/category-home-garden-wares.jpg` | `apps/api/uploads/public/catalog/0190c8a0-1000-7000-8000-000000000003/9cc8f6c8-0f38-4406-81a3-80a27efe124f-home-garden-facility-supplies-category.png` | `/media/presentation/v2/international/home-garden-wares.webp` | 41,488 | Curated source visually checked; canonical override regression passes |
| Industrial Machinery, Tools & Processing Equipment | `/media/international/category-machineries.jpg` | `apps/api/uploads/public/catalog/0190c8a0-1000-7000-8000-000000000004/ffbf0a53-b110-43fe-83df-02a6b23c8e64-industrial-machinery-tools-processing-equipment-category.png` | `/media/presentation/v2/international/machineries.webp` | 49,038 | Curated source visually checked; canonical override regression passes |
| General Procurement & Custom Sourcing | `/media/international/category-general-procurement.jpg` | `apps/api/uploads/public/catalog/0190c8a0-1000-7000-8000-000000000005/f95c0cfe-10c8-4dfd-96a4-7e0b28455b0d-general-procurement-custom-sourcing-category.png` | `/media/presentation/v2/international/general-procurement.webp` | 64,604 | Curated source visually checked; canonical override regression passes |
| Home Appliances & Living Equipment | `/media/international/category-home-appliances.png` | `apps/api/uploads/public/catalog/0190c8c0-1000-7000-8000-000000000001/42ce71ad-5e34-4e20-a33c-2b42159838c3-home-appliances-living-equipment-category.png` | `/media/presentation/v2/international/home-appliances.webp` | 24,230 | Curated source visually checked; canonical override regression passes |
| Office, Business & Commercial Technology | `/media/international/category-office-business.png` | `apps/api/uploads/public/catalog/0190c8c0-1000-7000-8000-000000000002/cdd1cfb4-de95-4d1a-a56e-3e48159aa1dd-office-business-commercial-technology-category.png` | `/media/presentation/v2/international/office-business.webp` | 37,846 | Curated source visually checked; canonical override regression passes |
| Fashion, Textiles, Uniforms & Accessories | `/media/international/category-fashion-textiles.png` | `apps/api/uploads/public/catalog/0190c8c0-1000-7000-8000-000000000003/387a6f2e-0485-47e9-8c46-d62e08dbbaf8-fashion-textiles-uniforms-accessories-category.png` | `/media/presentation/v2/international/fashion-textiles.webp` | 61,450 | Curated source visually checked; canonical override regression passes |
| Beauty, Salon & Spa Equipment | `/media/international/category-beauty-spa-salon.png` | `apps/api/uploads/public/catalog/0190c8c0-1000-7000-8000-000000000004/e49bb469-9255-41e1-814b-401048c49f3e-beauty-salon-spa-equipment-category.png` | `/media/presentation/v2/international/beauty-spa-salon.webp` | 42,362 | Curated source visually checked; canonical override regression passes |
| Retail, Store Setup & Merchandising Equipment | `/media/international/category-retail-store-setup.png` | `apps/api/uploads/public/catalog/0190c8c0-1000-7000-8000-000000000005/57f89725-18bf-4c8f-9484-8e80220c0610-retail-store-setup-merchandising-equipment-category.png` | `/media/presentation/v2/international/retail-store-setup.webp` | 59,630 | Curated source visually checked; canonical override regression passes |

## B. Integrated Export

Old behavior likewise preferred persistent API heroMedia. The listed tracked WebP was the previous canonical fallback and remains the source original.

| Commodity | Old source artwork | Final canonical source | Optimized bytes | Status |
|---|---|---|---:|---|
| Sesame Seeds | `/media/ie/commodities/sesame-seeds/hero/ie-sesame-seeds-hero-01.webp` | `/media/presentation/v2/ie/sesame-seeds.webp` | 49,646 | Canonical cover and stale override tests pass |
| Cashew | `/media/ie/commodities/cashew/hero/ie-cashew-hero-01.webp` | `/media/presentation/v2/ie/cashew.webp` | 68,080 | Canonical cover and stale override tests pass |
| Ginger | `/media/ie/commodities/ginger/hero/ie-ginger-hero-01.webp` | `/media/presentation/v2/ie/ginger.webp` | 84,046 | Canonical cover and stale override tests pass |
| Hibiscus | `/media/ie/commodities/hibiscus/hero/ie-hibiscus-hero-01.webp` | `/media/presentation/v2/ie/hibiscus.webp` | 94,448 | Canonical cover and stale override tests pass |
| Shea | `/media/ie/commodities/shea/hero/ie-shea-hero-01.webp` | `/media/presentation/v2/ie/shea.webp` | 207,700 | Canonical cover and stale override tests pass |
| Soybean | `/media/ie/commodities/soybean/hero/ie-soybean-hero-01.webp` | `/media/presentation/v2/ie/soybean.webp` | 90,400 | Canonical cover and stale override tests pass |
| Cocoa | `/media/ie/commodities/cocoa/hero/ie-cocoa-hero-01.webp` | `/media/presentation/v2/ie/cocoa.webp` | 91,660 | Canonical cover and stale override tests pass |

## C. Business identities

| Location | Previous identity image | Current identity | Asset |
|---|---|---|---|
| Homepage International introduction | Text only (no gateway photo in current baseline) | Actual International logo | `/almahbub.svg` |
| Homepage Export introduction | Text only (no gateway photo in current baseline) | Actual Integrated Export logo | `/media/brands/almahbub-integrated-export.jpg` |
| About International | Workshop/technical drawing photograph | Actual International logo | `/almahbub.svg` |
| About Export | Assorted spices photograph | Actual Integrated Export logo | `/media/brands/almahbub-integrated-export.jpg` |
| Shared GroupBusinessCard | Existing small logo plus obsolete imagery-forthcoming label | Shared contained BusinessLogo | Correct respective path above |
| GroupBusinessMark / selector | Already correct logo mapping; text-only navigation | Mapping consolidated into BUSINESS_LOGOS | Correct respective path above |

BusinessLogo uses a modest 220?104 surface, a contained image, meaningful alt text and a white logo surface in both themes. No brand artwork was invented or generated.

## D. Wedding entry

`CelebrationHost.tsx`: sparkle character U+2726 replaced by GiftIcon, a dependency-free currentColor SVG following existing project icon conventions. No suitable installed gift icon library was found. Accessible label remains ?Return to Rowdotul HAMD'26?. Toggle, routing, dismiss/re-entry, animation and reduced-motion logic remain unchanged; existing campaign regressions pass.

## E. Performance and precedence

- Known canonical International slug ? curated static cover ? one terminal accessible placeholder.
- Known IE slug ? canonical static hero ? one terminal accessible placeholder. Explicitly recognized gallery filenames ? existing canonical gallery artwork ? placeholder. Unmapped gallery/runtime uploads retain their provider URLs.
- Product adapter and runtime media management retain administrator-controlled imagery. No API provider, authorization, upload or storage code changed.
- Homepage and business landing introductions use the curated presentation taxonomy directly, independent of API startup. They claim no stock, price or publication state.
- IE live catalogue and known detail routes show canonical artwork while their API record request is pending; resolved empty/unpublished results still replace that loading presentation. Commercial details remain API-authoritative. No seed snapshot or fabricated published records were added.
- Legacy relative catalogue-media rows do not supply canonical cover URLs anymore. Re-import is not needed for canonical presentation; provider migration/import remains relevant only for runtime/admin or otherwise unmapped media.
- Images use same-origin `/media/...` paths, img elements, async decoding and reserved aspect ratios. No API-image timeout or error must happen before static display; no CSS background or blanket preload was introduced.
- Below-fold covers remain lazy; leading business-page cards are eager, and the eager IE detail hero has high fetch priority. Matching static URLs are reused across preview/grid/detail.
- Confirmed historical cost: multi-megabyte International PNGs and fallback chains behind API/provider requests. Actual production latency of several minutes was not measured or reproduced, so no specific production duration is claimed.

The 17 preferred source covers total **23,940,832 bytes**; derivatives total **1,151,706 bytes** (95.19% smaller). The previous 17 default static files totaled **15,132,359 bytes**, so default-cover payload falls 92.39%. Original sources are preserved; they are not requested by these canonical cards.

| Asset | Original format / dimensions | Before bytes | Final format / dimensions | After bytes | Delivery |
|---|---|---:|---|---:|---|
| International: iphones-gadgets | PNG / 1536?1024 | 2,053,303 | WebP / 960?640 | 43,994 | `/media/presentation/v2/international/iphones-gadgets.webp` |
| International: medical-equipments | PNG / 1536?1024 | 2,045,482 | WebP / 960?640 | 41,084 | `/media/presentation/v2/international/medical-equipments.webp` |
| International: home-garden-wares | PNG / 1536?1024 | 1,913,098 | WebP / 960?640 | 41,488 | `/media/presentation/v2/international/home-garden-wares.webp` |
| International: machineries | PNG / 1536?1024 | 2,234,992 | WebP / 960?640 | 49,038 | `/media/presentation/v2/international/machineries.webp` |
| International: general-procurement | PNG / 1536?1024 | 2,544,951 | WebP / 960?640 | 64,604 | `/media/presentation/v2/international/general-procurement.webp` |
| International: home-appliances | PNG / 1536?1024 | 1,950,620 | WebP / 960?640 | 24,230 | `/media/presentation/v2/international/home-appliances.webp` |
| International: office-business | PNG / 1536?1024 | 2,284,619 | WebP / 960?640 | 37,846 | `/media/presentation/v2/international/office-business.webp` |
| International: fashion-textiles | PNG / 1536?1024 | 2,545,460 | WebP / 960?640 | 61,450 | `/media/presentation/v2/international/fashion-textiles.webp` |
| International: beauty-spa-salon | PNG / 1536?1024 | 2,160,608 | WebP / 960?640 | 42,362 | `/media/presentation/v2/international/beauty-spa-salon.webp` |
| International: retail-store-setup | PNG / 1536?1024 | 2,267,035 | WebP / 960?640 | 59,630 | `/media/presentation/v2/international/retail-store-setup.webp` |
| IE: sesame-seeds | WEBP / 1920?1280 | 126,052 | WebP / 960?640 | 49,646 | `/media/presentation/v2/ie/sesame-seeds.webp` |
| IE: cashew | WEBP / 1920?1280 | 181,162 | WebP / 960?640 | 68,080 | `/media/presentation/v2/ie/cashew.webp` |
| IE: ginger | WEBP / 1920?2560 | 382,716 | WebP / 720?960 | 84,046 | `/media/presentation/v2/ie/ginger.webp` |
| IE: hibiscus | WEBP / 1920?1280 | 290,558 | WebP / 960?640 | 94,448 | `/media/presentation/v2/ie/hibiscus.webp` |
| IE: shea | WEBP / 1136?852 | 327,212 | WebP / 960?720 | 207,700 | `/media/presentation/v2/ie/shea.webp` |
| IE: soybean | WEBP / 1920?1442 | 353,742 | WebP / 960?721 | 90,400 | `/media/presentation/v2/ie/soybean.webp` |
| IE: cocoa | WEBP / 1920?1440 | 279,222 | WebP / 960?720 | 91,660 | `/media/presentation/v2/ie/cocoa.webp` |

The 12 existing canonical gallery WebPs are retained, individually 55,072?294,062 bytes and loaded only in their gallery context. They are already smaller than the original multi-megabyte category images and preserve the intended gallery artwork.

Local Vite production preview returns image/webp, HTTP 200 and Cache-Control: no-cache (revalidation). Production Render/CDN headers are not represented by this local header and were not verified or changed. Direct versioned static paths avoid the API route; no API cache or hosted configuration was altered.

## F. Validation

- Focused Web regression tests: 68 distinct tests across nine relevant files pass (54 initial tests, 12 added gallery cases, two cold-start cases; affected files rerun after each change).
- Web typecheck and production build: pass. Modified TS/TSX and review-script lint: pass. git diff --check: pass.
- Final production-browser review: 70 checks passed. Local browser checks: 320, 360, 390, 430, 768, 1024, 1440 and 1600 px; all 17 cover URLs decoded, direct static requests, no duplicate successful cover downloads, no stale provider fetches, static 404 terminal placeholders, no broken-image icons/raw alt text, stable fallback geometry and no document overflow.
- In forced-404 runs, Chromium sometimes issued additional parser-initiated requests (up to one per affected URL). CDP tracing confirmed no repeated application-initiated attempts, all network activity settled, and all 17 image elements were replaced by terminal placeholders. This is reported separately from successful image-download duplication.
- Light/dark logo and About checks: 390 and 1440 px; actual logo decoding, contained sizing, no overflow and scoped WCAG AA checks pass.
- API tests not rerun for this Web-only change; no API implementation was modified by this task. Unrelated historical full-suite failures were not reevaluated.
- Browser artifacts/screenshots remain in ignored apps/web/commerce-test-results. The reusable review script is apps/web/e2e/canonical-presentation-review.mjs.

## G. Repository safety

The two logo assets and original artwork are already Git tracked. Exact Linux casing is tested for all canonical paths, galleries and logos. The 17 new derivative files and new source/report files are currently untracked working-tree additions and must be included in the eventual release commit. Nothing was staged or committed. Full working-tree status is provided in the final response. No generated runtime/test output is staged.
