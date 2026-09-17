/* global process, console */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PRODUCT_SHOWCASE_GROUPS, compareProductPriority, productShowcaseGroup, productMediaRoute, isDeferredShowcaseProduct } from '@hamd/constants';

// Active V2 seed definitions only; importing this module performs no database work.
const { EXPANDED_CATALOGUE_PRODUCTS: products } = await import(new URL('../../../../database/prisma/seed/expanded-catalogue.ts', import.meta.url).href);
const output = new URL('../../../../database/media/', import.meta.url);
const approvedGroups = PRODUCT_SHOWCASE_GROUPS.map(group => ({ id: group.id, label: group.label }));
const groups = approvedGroups.map(group => ({ ...group, rows: products.filter(product => productShowcaseGroup(product.name, product.categorySlug) === group.id && !/custom|flame.resistant/i.test(product.name)).sort(compareProductPriority) }));
const queue = [];
// Interleave the six requested groups instead of letting 80 similar electronics
// rows consume the entire front of the acquisition batch.
while (queue.length < 200 && groups.some(group => group.rows.length)) {
  for (const group of groups) {
    const product = group.rows.shift();
    if (!product || queue.length === 200) continue;
    queue.push({ rank: queue.length + 1, productSlug: product.slug, name: product.name,
      categorySlug: product.categorySlug, showcaseGroup: group.id, route: productMediaRoute(product.name),
      status: 'awaiting_media', primaryFilename: `${product.slug}-primary.webp`,
      brief: `Show the actual generic identity '${product.name}' in clean premium ecommerce photography, front or three-quarter view, realistic proportions and construction. Show complete finished outfits for sets. No fake designer logos, text, watermarks or copied branded designs. Confirm physical form before generation; ambiguous identities require research.`,
      approvalGate: 'Validate identity, exact category, rights/provenance, image quality, WebP derivative and duplicate checks before attaching to a real product. No category artwork as a product photo.',
    });
  }
}
const research = ['iPhone series', 'Samsung Galaxy phones and tablets', 'HP laptops', 'Lenovo laptops', 'Dell laptops', 'Exact designer kaftans / senator wear / agbada', 'Exact designer gowns / abayas / boutique ready-to-wear', 'Latest and designer sneakers', 'Exact branded bags / watches / accessories', 'Exact manufacturer/model machinery and spare parts'].map(request => ({ request, route: 'current_product_research', status: 'unverified', productSlug: null, verifiedModel: null, sources: [], generationAllowed: false,
  requiredEvidence: 'Verify real current manufacturer/model/region, exact physical identity, official or licensed photography and usage rights. Match a real catalogue record before import. No guessed trending models.' }));
const gaps = [
  'Fashion category exists but the active seed lacks kaftans, senator wear, agbada, premium gowns, abayas and boutique ready-to-wear. Polo/T-shirt lots are not substitutes for these identities.',
  'Fashion footwear currently covers work boots and safety shoes, not the requested consumer sneaker, loafer, heel, slide or sandal range.',
  'Handbags, shoulder/tote/crossbody bags, belts, watches, sunglasses and wallets require actual product definitions; existing backpacks/travel bags/briefcases stay in their real categories.',
  'Mechanical spare parts (bearings, couplings, shafts, pulleys, sprockets, chains, valves, flanges, gaskets, hydraulic hoses, motors, filters and generator/compressor spares) require exact identity matching. Existing pumps/generators/compressors/tool kits do not establish spare-parts coverage.',
  'Standalone document scanners, stand mixers and air fryers need actual catalogue identities. Existing barcode scanners are not document scanners. Printers/routers/projectors remain in their current Electronics category; photocopiers remain Office.',
  'No branded model is verified by this offline queue builder. Research tasks are not products, stock claims or permission to generate branded lookalikes.',
];
// Fail before writing if any identity/category drift or excluded family slips in.
if (queue.length !== 200 || new Set(queue.map(row => row.productSlug)).size !== 200) throw new Error('Insufficient unique existing identities; do not pad with invented products.');
for (const row of queue) {
  const source = products.find(product => product.slug === row.productSlug);
  if (!source || source.name !== row.name || source.categorySlug !== row.categorySlug || isDeferredShowcaseProduct(row.name)) throw new Error(`Invalid queue identity: ${row.productSlug}`);
}
const result = { schemaVersion: 1, source: 'Active V2 seed definitions; live database not queried',
  scope: 'Planning only; no generation, acquisition, database writes or automatic imports',
  sourceSha256: createHash('sha256').update(JSON.stringify(products)).digest('hex'),
  ranking: 'Six owner-requested groups interleaved; recognized product families first; POS/fabric/filler excluded. Source identities and categories preserved. No market-currentness claim without research.',
  groups: approvedGroups, products: queue, current_product_research: research, catalogueGaps: gaps };
const contents = JSON.stringify(result, null, 2) + '\n';
const target = new URL('first-wave-product-media.json', output);
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== contents) throw new Error('Queue differs from current policy/seed. Rebuild and review.');
  console.log('PASS: 200 identities, category preservation, no POS/fabric, research separation and reproducible queue.');
} else {
  await mkdir(output, { recursive: true });
  await writeFile(target, contents);
  const table = queue.map(row => `| ${row.rank} | ${row.name} | ${row.categorySlug} | ${row.route} |`).join('\n');
  await writeFile(new URL('FIRST-WAVE.md', output), `# V2 first-wave product media\n\n200 existing generic identities, interleaved across the six requested groups. No POS terminals or fabric rolls. This is a planning queue, not proof of generated media or current branded stock. Exact branded/trending designs remain blocked on research.\n\n## Coverage gaps\n\n${gaps.map(gap => '- '+gap).join('\n')}\n\n## Ranked queue\n\n| Rank | Product | Existing category | Route |\n|---:|---|---|---|\n${table}\n`);
  console.log(`Wrote ${fileURLToPath(target)} (${queue.length} existing identities; ${research.length} research briefs).`);
}
