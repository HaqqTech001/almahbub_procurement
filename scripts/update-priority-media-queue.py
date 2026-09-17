"""Build the editorial first wave from existing catalogue identities only. No I/O to APIs."""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'catalogue-package'
MANIFEST = ROOT / 'almahbub-beta-media-runner/beta-product-media-manifest.json'
# Category ceilings prevent the largest families from crowding out other operations.
QUOTAS = {'iphones-gadgets': 50, 'office-business': 30, 'home-appliances': 40,
          'home-garden-wares': 30, 'machineries': 30, 'fashion-textiles': 15,
          'beauty-spa-salon': 26, 'medical-equipments': 25, 'retail-store-setup': 4}
# Ordered product families are editorial priorities, not measured market demand.
FAMILIES = {
 'iphones-gadgets': ['Smartphone', 'Tablet', 'Laptop', 'Desktop Computer', 'Monitor', 'Headset', 'Audio Speaker', 'Power Bank', 'External SSD', 'Projector', 'Network Router', 'Wireless Access Point', 'Keyboard', 'Computer Mouse', 'Webcam', 'USB Hub', 'External Hard Drive', 'Multifunction Printer'],
 'office-business': ['Photocopier', 'Interactive Display', 'Conference Camera', 'Document Shredder', 'Laminating Machine', 'Binding Machine', 'Uninterruptible Power Supply', 'Receipt Printer'],
 'home-appliances': ['Chest Freezer', 'Household Refrigerator', 'Upright Freezer', 'Air Conditioner', 'Washing Machine', 'Clothes Dryer', 'Dishwasher', 'Electric Oven', 'Cooking Range', 'Microwave Oven', 'Blender', 'Coffee Maker', 'Electric Kettle', 'Water Dispenser', 'Vacuum Cleaner', 'Electric Iron', 'Water Heater', 'Air Purifier'],
 'home-garden-wares': ['Sofa', 'Dining Table', 'Bed Frame', 'Wardrobe', 'Shelving Unit', 'Outdoor Chair', 'Garden Table', 'Lawn Mower', 'Hedge Trimmer', 'Pressure Washer', 'Brush Cutter'],
 'machineries': ['Diesel Generator', 'Petrol Generator', 'Air Compressor', 'Welding Machine', 'Water Pump', 'Drill Press', 'Milling Machine', 'Grinding Machine', 'Metal Cutting Machine', 'Sealing Machine', 'Packaging Machine', 'Workshop Tool Set', 'Agricultural Sprayer'],
 'fashion-textiles': ['Polo Shirt Lot', 'T-Shirt Lot', 'Corporate Uniform Set', 'Medical Scrub Set', 'Laptop Backpack', 'Executive Briefcase', 'Travel Duffel Bag', 'Document Bag', 'Work Boot', 'Safety Shoe'],
 'beauty-spa-salon': ['Salon Styling Chair', 'Shampoo Station', 'Manicure Table', 'Salon Mirror Station', 'Towel Warmer', 'Facial Steamer', 'Hair Steamer', 'Salon Trolley', 'Hair Clipper', 'Wax Heater', 'Nail Lamp', 'Beauty Storage Cabinet'],
 'medical-equipments': ['Hospital Bed', 'Patient Trolley', 'Examination Light', 'Wheelchair', 'Blood Pressure Monitor', 'Pulse Oximeter', 'Microscope', 'Laboratory Centrifuge', 'Medical Refrigerator', 'Autoclave', 'Medical Scale'],
 'retail-store-setup': ['Label Printer'],
}
WEIGHTS = dict(visualAttractiveness=7, commercialRelevance=6, currentMarketAppeal=5,
               categoryCoverage=4, buyerAttraction=3, recognizability=2, promotionSuitability=1)

def generate():
    catalogue = json.loads((PACKAGE / 'expanded-catalogue.json').read_text(encoding='utf-8'))
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    existing = {p['slug']: p for p in manifest['products']}
    categories = {c['slug']: c['name'] for c in catalogue['categories']}
    candidates = []
    for product in catalogue['products']:
        category, name = product['categorySlug'], product['name']
        if category not in QUOTAS or re.search(r'POS|Point-of-Sale|Fabric|Custom|Flame-resistant|Multipurpose|Vertical-form-fill', name, re.I):
            continue
        family = next((f for f in FAMILIES[category] if f.lower() in name.lower()), None)
        if not family:
            continue
        priority = FAMILIES[category].index(family)
        modern = bool(re.search(r'Premium|All-in-one|Ultrawide|High-refresh|Wireless|4K|Side-by-side|French-door|Inverter|Front-load|Sectional|LED|Silent|Rotary-screw|Cordless|Digital|Colour', name))
        scores = dict(visualAttractiveness=5 if modern else 4, commercialRelevance=5,
                      currentMarketAppeal=4 if modern else 3, categoryCoverage=5,
                      buyerAttraction=5 if priority < 5 else 4, recognizability=5,
                      promotionSuitability=5 if priority < 5 else 4)
        base = sum(scores[key] * weight for key, weight in WEIGHTS.items()) - priority / 10
        candidates.append((product, family, scores, base))
    chosen, category_counts, family_counts = [], Counter(), Counter()
    while len(chosen) < sum(QUOTAS.values()):
        eligible = [c for c in candidates if category_counts[c[0]['categorySlug']] < QUOTAS[c[0]['categorySlug']] and family_counts[(c[0]['categorySlug'], c[1])] < 4]
        if not eligible:
            raise ValueError(f'Only {len(chosen)} eligible identities; do not pad the queue with filler')
        candidate = max(eligible, key=lambda c: (c[3] - 9 * category_counts[c[0]['categorySlug']] / QUOTAS[c[0]['categorySlug']] - 5 * family_counts[(c[0]['categorySlug'], c[1])], c[0]['slug']))
        product, family, scores, base = candidate
        category = product['categorySlug']
        category_counts[category] += 1
        family_counts[(category, family)] += 1
        row = dict(existing.get(product['slug'], {}))
        row.update(product)
        row.pop('status', None)
        row.pop('sourcingStatus', None)
        row.update(categoryName=categories[category], globalPriority=len(chosen)+1,
                   priorityWithinCategory=category_counts[category], mediaRoute='generation_ready',
                   identityScope='generic_existing_catalogue_product', family=family,
                   editorialScores=scores, weightedEditorialScore=round(base, 2),
                   priorityReason=f'{family}: requested first-wave family; category diversity and variant repetition are balanced.',
                   targetFilename=f"{product['slug']}-primary.webp", targetAltText=f"Representative {product['name']} product view",
                   searchQuery=f"{name} product photo", openverseQuery=name, wikimediaQuery=name,
                   mediaRole='primary', position=0, isPrimary=True)
        for key, value in dict(acquisitionStatus='needs_source', reviewStatus='pending',
            fallbackPolicy='use_existing_category_image_until_valid_product_primary_is_imported',
            sourcePageUrl='', sourceAssetUrl='', license='', licenseUrl='', creator='', attribution='', storageKey='', sha256='').items():
            row.setdefault(key, value)
        row['generationBrief'] = f'Modern representative {name}; show only the named physical product, clearly recognizable construction, clean premium ecommerce photography, neutral background, realistic proportions, no logos, text or watermark. Never imitate an exact branded model or imply verified specifications.'
        if category == 'fashion-textiles':
            row['generationBrief'] += ' Show finished clothing or accessories, never fabric rolls. For an outfit set, show the complete top and trousers clearly from the front or three-quarter view; no fake designer marks.'
        if category in ('machineries', 'medical-equipments'):
            row['generationBrief'] += ' Confirm the physical configuration before generation; stop for identity clarification if ambiguous. No manufacturer/model lookalikes, invented safety labels or efficacy claims.'
        row['releaseGate'] = 'Identity match, visual review, provenance/usage rights, MIME/dimensions and duplicate checks before import. generation_ready is a planning route, not generated or import-ready media.'
        chosen.append(row)
        candidates.remove(candidate)
    manifest.update(targetCount=len(chosen), products=chosen,
        purpose='Ranked first-wave primary-image acquisition queue for existing generic product identities',
        selectionStrategy='250 editorially ranked identities; seven weighted criteria, category quotas and a maximum of four variants per family. No POS terminals or fabric-roll presentation. Separate research/gap briefs are not products.',
        rankingPolicy={'weights': WEIGHTS, 'categoryQuotas': QUOTAS, 'scoresAre': 'Editorial judgments, not verified current-market research', 'familyRepeatPenalty': 5, 'categorySaturationPenalty': 9},
        researchQueue='../catalogue-package/current-product-research.json',
        requestedCoverage='../catalogue-package/priority-media-requested-coverage.json')
    manifest['rules'].update(exactBrandedProducts='current_product_research only; verify model, official source and image rights before adding a real product mapping',
        preserveDatabaseCategory=True, excludePosTerminals=True, excludeFabricFirstWave=True,
        doNotGenerateExactBrandedLookalikes=True)
    source = {p['slug']: p for p in catalogue['products']}
    assert len(chosen) == len({p['slug'] for p in chosen}) == 250
    assert dict(category_counts) == QUOTAS
    for row in chosen:
        original = source[row['slug']]
        assert (row['name'], row['categorySlug']) == (original['name'], original['categorySlug'])
        assert not re.search(r'\bPOS\b|Point-of-Sale|Fabric', row['name'], re.I)
        assert row['mediaRoute'] == 'generation_ready'
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    return manifest

if __name__ == '__main__':
    result = generate()
    print(json.dumps({'count': result['targetCount'], 'categories': dict(Counter(p['categorySlug'] for p in result['products']))}))
