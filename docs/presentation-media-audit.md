# Permanent catalogue presentation media audit

Current database verification was attempted read-only and timed out. This report does not claim live production URLs, HTTP 404s, or Render configuration were verified. International URL candidates come from the explicit category-media-plan and existing local files. Integrated Export URLs come from the committed September 6 import report (18 media rows, HTTP 200 at that historical verification).

WEB_ORIGIN means the deployed Web origin; API_ORIGIN means its configured API origin. Absolute persistent API image overrides remain absolute and fall back to the listed static artwork on error. Missing/legacy local URLs select static artwork immediately. Catalogue publication, names, records and commercial fields remain API-authoritative.

## Table A: Almahbub International

| Name | Slug | Current image source / evidence | Storage | Static asset / final default browser path | New strategy | Status |
|---|---|---|---|---|---|---|
| Electronics, Mobile & Digital Technology | iphones-gadgets | Current DB unverified; exact local candidates in inventory JSON | Local API disk for legacy URLs | `/media/international/category-iphones-gadgets.jpg` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Medical, Healthcare & Laboratory Equipment | medical-equipments | Current DB unverified; exact local candidates in inventory JSON | Local API disk for legacy URLs | `/media/international/category-medical-equipments.jpg` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Home, Garden & Facility Supplies | home-garden-wares | Current DB unverified; exact local candidates in inventory JSON | Local API disk for legacy URLs | `/media/international/category-home-garden-wares.jpg` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Industrial Machinery, Tools & Processing Equipment | machineries | Current DB unverified; exact local candidates in inventory JSON | Local API disk for legacy URLs | `/media/international/category-machineries.jpg` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| General Procurement & Custom Sourcing | general-procurement | Current DB unverified; exact local candidates in inventory JSON | Local API disk for legacy URLs | `/media/international/category-general-procurement.jpg` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Home Appliances & Living Equipment | home-appliances | Current DB unverified; exact local candidates in inventory JSON | Local API disk for legacy URLs | `/media/international/category-home-appliances.png` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Office, Business & Commercial Technology | office-business | Current DB unverified; exact local candidates in inventory JSON | Local API disk for legacy URLs | `/media/international/category-office-business.png` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Fashion, Textiles, Uniforms & Accessories | fashion-textiles | Current DB unverified; exact local candidates in inventory JSON | Local API disk for legacy URLs | `/media/international/category-fashion-textiles.png` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Beauty, Salon & Spa Equipment | beauty-spa-salon | Current DB unverified; exact local candidates in inventory JSON | Local API disk for legacy URLs | `/media/international/category-beauty-spa-salon.png` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Retail, Store Setup & Merchandising Equipment | retail-store-setup | Current DB unverified; exact local candidates in inventory JSON | Local API disk for legacy URLs | `/media/international/category-retail-store-setup.png` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |

## Table B: Almahbub Integrated Export

| Name | Slug | Current image source / evidence | Storage | Static asset / final default browser path | New strategy | Status |
|---|---|---|---|---|---|---|
| Sesame Seeds | sesame-seeds | `/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000e001/ie-sesame-seeds-hero-01.jpg` (historical) | Local API disk | `/media/ie/commodities/sesame-seeds/hero/ie-sesame-seeds-hero-01.webp` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Cashew | cashew | `/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000e002/ie-cashew-hero-01.jpg` (historical) | Local API disk | `/media/ie/commodities/cashew/hero/ie-cashew-hero-01.webp` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Ginger | ginger | `/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000e003/ie-ginger-hero-01.jpg` (historical) | Local API disk | `/media/ie/commodities/ginger/hero/ie-ginger-hero-01.webp` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Hibiscus | hibiscus | `/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000e004/ie-hibiscus-hero-01.jpg` (historical) | Local API disk | `/media/ie/commodities/hibiscus/hero/ie-hibiscus-hero-01.webp` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Shea | shea | `/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000e005/ie-shea-hero-01.jpg` (historical) | Local API disk | `/media/ie/commodities/shea/hero/ie-shea-hero-01.webp` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Soybean | soybean | `/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000e006/ie-soybean-hero-01.jpg` (historical) | Local API disk | `/media/ie/commodities/soybean/hero/ie-soybean-hero-01.webp` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |
| Cocoa | cocoa | `/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000e007/ie-cocoa-whole-01.jpg` (historical) | Local API disk | `/media/ie/commodities/cocoa/hero/ie-cocoa-hero-01.webp` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |

## Audit scope and causes

- International homepage and business-line category cards share CommerceCatalogue and toCategoryItem. They previously rendered database media in a raw img with no error recovery. All ten canonical categories now have intentional static cover mappings.
- Integrated Export homepage/business-line previews, commodity cards, detail heroes and gallery items use the API adapter and IeCommodityImage. Legacy hero paths and explicitly matched historical gallery filenames now resolve to tracked artwork. Unknown admin gallery images remain assigned images with a designed error placeholder.
- Product grids/detail and procurement product previews are runtime/admin media, not canonical category artwork. They continue using product identity and existing product media controls; arbitrary product uploads were not copied into Git.
- Business logos, portal artwork and industry imagery already use Web static assets. Wedding media, announcement attachments and private documents are separate runtime content and were not replaced with catalogue artwork.
- Integrated Export app wiring ignored CATALOG_MEDIA_DRIVER and NODE_ENV when constructing its media store. This allowed local writes even while Ops used Supabase/S3. Both services now receive one configured store.
- Local writes return /api/v1/public/catalog-media/<entity UUID>/<filename>. That route only reads UPLOAD_ROOT/public/catalog. A missing local file, invalid path or unknown entity returns 404. Restart/redeploy on an ephemeral instance can remove those files. Live Render disk/configuration was not accessible, so involvement is architectural exposure, not a verified deployment fact.
- Supabase/S3 writes return absolute object URLs and public reads go directly to that provider. There is no write/read mismatch for those new URLs. Existing relative URLs do not automatically become object-storage URLs after changing drivers.
- Stale relative URLs are confirmed in the historical IE import report. Whether those rows are still current requires the read-only DB audit to succeed. No live production 404 was confirmed in this run.

## Assets and validation

- Reused five tracked International JPEG covers, seven tracked IE hero covers and twelve tracked IE gallery/context images. Recovered five curated International PNG covers matching category-media-plan from local storage into apps/web/public/media/international. These are the planned category covers, not arbitrary admin product uploads.
- No canonical cover is missing and no new image sourcing is required. The five recovered PNGs total approximately 11 MB; they retain original bytes and provenance. Further lossless/format optimization can reduce transfer size.
- 29 static assets returned local HTTP 200 with the correct image MIME and decoded in Chromium. See presentation-assets-verification.json for dimensions and paths. These are local verification results, not a claim about production deployment.
- Regression tests check all canonical identities, exact Linux path casing, persistent override failure, legacy paths, matching IE gallery recovery, duplicate fallback URLs, and source changes. Final placeholders retain accessible labels and content aspect ratios.

## Approved execution still required for runtime media recovery

1. Run the read-only apps/api/src/scripts/audit-presentation-media.mjs when database access is available. Export category imageUrl/imageStorageKey, commodity heroMedia/gallery, and affected product media URLs before any change.
2. Confirm the production provider, public bucket/CDN policy and credentials in deployment settings. Configure Supabase/S3; do not rely on local disk. This work did not modify .env.
3. Recover each original file from a verified backup/local source; validate identity, MIME, decode, checksum and usage rights. Never rewrite a URL to an object that has not been uploaded.
4. After explicit approval, re-upload category covers using the existing import-category-media script or Ops upload endpoint; commodity heroes using the existing IE upload endpoint; gallery objects using the same configured store, then update their media JSON. Preserve publication and unrelated fields.
5. Verify each new public object URL from a clean browser, update only the corresponding database fields with an old-value check, and retain an old/new URL manifest for rollback. Validate after a new API instance starts. Do not delete originals until recovery is verified.
6. No schema migration is needed for this source fix. Media/data re-import may be required for old relative URLs. No hosted Supabase modifications, migrations, uploads, commits, pushes or deployments were performed.

## Check results and exact working-tree files

- Focused Web: 39/39 tests passed across five suites, including 21 permanent-media regression tests.
- Focused API: 21/21 tests passed across four suites, including Supabase/S3 IE application wiring.
- Web production build (including TypeScript) and API build/typecheck passed. Modified TypeScript lint and git diff --check passed.
- Existing unrelated changes were preserved: apps/ops/src/modules/WeddingCampaignPage.tsx, apps/web/src/integrated-export/pages/IeCommoditiesPage.tsx, apps/web/src/wedding/WeddingLandingPage.tsx, apps/web/src/wedding/WeddingLivePage.test.tsx.
- Everything else in the status below belongs to this media correction. New static files are untracked until the user chooses to stage/commit; the agent did neither.

```text
 M apps/api/src/app.ts
 M apps/ops/src/modules/WeddingCampaignPage.tsx
 M apps/web/src/components/CommerceCatalogue.tsx
 M apps/web/src/integrated-export/IeCommodityCard.tsx
 M apps/web/src/integrated-export/IeCommodityImage.test.tsx
 M apps/web/src/integrated-export/IeCommodityImage.tsx
 M apps/web/src/integrated-export/commodities/map-ie-commodity.ts
 M apps/web/src/integrated-export/pages/IeCommoditiesPage.tsx
 M apps/web/src/integrated-export/pages/IeCommodityDetailView.tsx
 M apps/web/src/lib/homepage-products.test.ts
 M apps/web/src/lib/homepage-products.ts
 M apps/web/src/wedding/WeddingLandingPage.tsx
 M apps/web/src/wedding/WeddingLivePage.test.tsx
?? apps/api/src/modules/integrated-export/tests/ie-storage-wiring.test.ts
?? apps/api/src/scripts/audit-presentation-media.mjs
?? apps/web/e2e/audit-presentation-assets.mjs
?? apps/web/public/media/international/category-beauty-spa-salon.png
?? apps/web/public/media/international/category-fashion-textiles.png
?? apps/web/public/media/international/category-home-appliances.png
?? apps/web/public/media/international/category-office-business.png
?? apps/web/public/media/international/category-retail-store-setup.png
?? apps/web/src/components/PresentationImage.tsx
?? apps/web/src/content/presentation-media.test.tsx
?? apps/web/src/content/presentation-media.ts
?? apps/web/src/styles/presentation-image.css
?? docs/presentation-assets-verification.json
?? docs/presentation-media-audit.md
?? docs/presentation-media-inventory.json
?? scripts/build-presentation-media-audit.mjs
```

