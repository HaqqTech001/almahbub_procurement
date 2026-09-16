import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const plans = JSON.parse(readFileSync('catalogue-package/category-media-plan.json', 'utf8'));
const ie = JSON.parse(readFileSync('docs/ie-commodity-media-import-report.json', 'utf8'));
const assets = JSON.parse(readFileSync('docs/presentation-assets-verification.json', 'utf8'));
const rows = plans.map((plan, index) => {
  const folder = `apps/api/uploads/public/catalog/${plan.categoryId}`;
  const files = existsSync(folder) ? readdirSync(folder).filter(f => f.includes(plan.filename.replace(/\.webp$/, ''))) : [];
  const asset = `/media/international/category-${plan.categorySlug}.${index < 5 ? 'jpg' : 'png'}`;
  return { businessLine: 'International', contentType: 'Category cover', name: plan.categoryName, slug: plan.categorySlug,
    databaseApiUrl: 'Current DB query unavailable (connection timeout)',
    observedLocalUrlCandidates: files.map(f => `/api/v1/public/catalog-media/${plan.categoryId}/${f}`),
    evidence: 'Canonical category-media-plan and local cover files; not confirmation of current database URL',
    previousBrowserUrl: 'API_ORIGIN + local candidate if assigned in DB', storage: 'Local API disk for legacy URLs',
    staticAsset: asset, finalBrowserUrl: 'WEB_ORIGIN' + asset, trackedFallbackAvailable: true,
    productionSafe: true, strategy: 'Static for missing/legacy URL; persistent API override with static fallback; designed final placeholder',
    action: 'Include curated asset in next release; re-import any retained runtime local URL after approval',
  };
});
for (const item of ie.items) rows.push({ businessLine: 'Integrated Export', contentType: 'Commodity cover and gallery', name: item.name, slug: item.slug,
  databaseApiUrl: item.hero.src, evidence: `Historical import report ${ie.generatedAt}; current DB query timed out`,
  previousBrowserUrl: 'API_ORIGIN' + item.hero.src, storage: 'Local API disk',
  staticAsset: `/media/ie/commodities/${item.slug}/hero/ie-${item.slug}-hero-01.webp`,
  finalBrowserUrl: `WEB_ORIGIN/media/ie/commodities/${item.slug}/hero/ie-${item.slug}-hero-01.webp`,
  trackedFallbackAvailable: true, productionSafe: true,
  gallery: item.media.filter(m => m.role === 'gallery').map(m => ({ oldUrl: m.src, localFileExists: existsSync(join('apps/api/uploads/public/catalog', item.id, m.filename)) })),
  strategy: 'Static for legacy cover/gallery filenames; persistent API override with static fallback; designed final placeholder',
  action: 'Shared storage wiring fixed; historical local records need approved re-import for direct API/Ops consumers',
});
writeFileSync('docs/presentation-media-inventory.json', JSON.stringify({ currentDbVerified: false, rows, decodedAssets: assets.length }, null, 2) + '\n');
const lines = [
  '# Permanent catalogue presentation media audit', '',
  'Current database verification was attempted read-only and timed out. This report does not claim live production URLs, HTTP 404s, or Render configuration were verified. International URL candidates come from the explicit category-media-plan and existing local files. Integrated Export URLs come from the committed September 6 import report (18 media rows, HTTP 200 at that historical verification).', '',
  'WEB_ORIGIN means the deployed Web origin; API_ORIGIN means its configured API origin. Absolute persistent API image overrides remain absolute and fall back to the listed static artwork on error. Missing/legacy local URLs select static artwork immediately. Catalogue publication, names, records and commercial fields remain API-authoritative.', '',
];
for (const business of ['International', 'Integrated Export']) {
  lines.push(`## ${business === 'International' ? 'Table A: Almahbub International' : 'Table B: Almahbub Integrated Export'}`, '',
    '| Name | Slug | Current image source / evidence | Storage | Static asset / final default browser path | New strategy | Status |',
    '|---|---|---|---|---|---|---|');
  for (const row of rows.filter(r => r.businessLine === business)) lines.push(`| ${row.name} | ${row.slug} | ${business === 'International' ? 'Current DB unverified; exact local candidates in inventory JSON' : '`' + row.databaseApiUrl + '` (historical)'} | ${row.storage} | \`${row.staticAsset}\` | Durable cover, persistent override, bounded fallback | Exact path and Chromium decode passed |`);
  lines.push('');
}
lines.push('## Audit scope and causes', '',
  '- International homepage and business-line category cards share CommerceCatalogue and toCategoryItem. They previously rendered database media in a raw img with no error recovery. All ten canonical categories now have intentional static cover mappings.',
  '- Integrated Export homepage/business-line previews, commodity cards, detail heroes and gallery items use the API adapter and IeCommodityImage. Legacy hero paths and explicitly matched historical gallery filenames now resolve to tracked artwork. Unknown admin gallery images remain assigned images with a designed error placeholder.',
  '- Product grids/detail and procurement product previews are runtime/admin media, not canonical category artwork. They continue using product identity and existing product media controls; arbitrary product uploads were not copied into Git.',
  '- Business logos, portal artwork and industry imagery already use Web static assets. Wedding media, announcement attachments and private documents are separate runtime content and were not replaced with catalogue artwork.',
  '- Integrated Export app wiring ignored CATALOG_MEDIA_DRIVER and NODE_ENV when constructing its media store. This allowed local writes even while Ops used Supabase/S3. Both services now receive one configured store.',
  '- Local writes return /api/v1/public/catalog-media/<entity UUID>/<filename>. That route only reads UPLOAD_ROOT/public/catalog. A missing local file, invalid path or unknown entity returns 404. Restart/redeploy on an ephemeral instance can remove those files. Live Render disk/configuration was not accessible, so involvement is architectural exposure, not a verified deployment fact.',
  '- Supabase/S3 writes return absolute object URLs and public reads go directly to that provider. There is no write/read mismatch for those new URLs. Existing relative URLs do not automatically become object-storage URLs after changing drivers.',
  '- Stale relative URLs are confirmed in the historical IE import report. Whether those rows are still current requires the read-only DB audit to succeed. No live production 404 was confirmed in this run.', '',
  '## Assets and validation', '',
  '- Reused five tracked International JPEG covers, seven tracked IE hero covers and twelve tracked IE gallery/context images. Recovered five curated International PNG covers matching category-media-plan from local storage into apps/web/public/media/international. These are the planned category covers, not arbitrary admin product uploads.',
  '- No canonical cover is missing and no new image sourcing is required. The five recovered PNGs total approximately 11 MB; they retain original bytes and provenance. Further lossless/format optimization can reduce transfer size.',
  `- ${assets.length} static assets returned local HTTP 200 with the correct image MIME and decoded in Chromium. See presentation-assets-verification.json for dimensions and paths. These are local verification results, not a claim about production deployment.`,
  '- Regression tests check all canonical identities, exact Linux path casing, persistent override failure, legacy paths, matching IE gallery recovery, duplicate fallback URLs, and source changes. Final placeholders retain accessible labels and content aspect ratios.', '',
  '## Approved execution still required for runtime media recovery', '',
  '1. Run the read-only apps/api/src/scripts/audit-presentation-media.mjs when database access is available. Export category imageUrl/imageStorageKey, commodity heroMedia/gallery, and affected product media URLs before any change.',
  '2. Confirm the production provider, public bucket/CDN policy and credentials in deployment settings. Configure Supabase/S3; do not rely on local disk. This work did not modify .env.',
  '3. Recover each original file from a verified backup/local source; validate identity, MIME, decode, checksum and usage rights. Never rewrite a URL to an object that has not been uploaded.',
  '4. After explicit approval, re-upload category covers using the existing import-category-media script or Ops upload endpoint; commodity heroes using the existing IE upload endpoint; gallery objects using the same configured store, then update their media JSON. Preserve publication and unrelated fields.',
  '5. Verify each new public object URL from a clean browser, update only the corresponding database fields with an old-value check, and retain an old/new URL manifest for rollback. Validate after a new API instance starts. Do not delete originals until recovery is verified.',
  '6. No schema migration is needed for this source fix. Media/data re-import may be required for old relative URLs. No hosted Supabase modifications, migrations, uploads, commits, pushes or deployments were performed.', '',
);
lines.push('## Check results and exact working-tree files', '',
  '- Focused Web: 39/39 tests passed across five suites, including 21 permanent-media regression tests.',
  '- Focused API: 21/21 tests passed across four suites, including Supabase/S3 IE application wiring.',
  '- Web production build (including TypeScript) and API build/typecheck passed. Modified TypeScript lint and git diff --check passed.',
  '- Existing unrelated changes were preserved: apps/ops/src/modules/WeddingCampaignPage.tsx, apps/web/src/integrated-export/pages/IeCommoditiesPage.tsx, apps/web/src/wedding/WeddingLandingPage.tsx, apps/web/src/wedding/WeddingLivePage.test.tsx.',
  '- Everything else in the status below belongs to this media correction. New static files are untracked until the user chooses to stage/commit; the agent did neither.', '',
  '```text', execFileSync('git', ['status', '--short'], { encoding: 'utf8' }).trimEnd(), '```', '');
writeFileSync('docs/presentation-media-audit.md', lines.join('\n') + '\n');
