# IE-11C — Media acquisition template

**Status:** Seven commodities **published** (2026-08-17). Licensed representative images staged; 50 remains a ceiling, not a quota.

Provenance: `docs/ie-commodity-media-provenance.json`. Staging script: `scripts/stage-ie-commodity-media.mjs`.

Companion JSON schema: [`ie-11c-media-acquisition-template.json`](./ie-11c-media-acquisition-template.json)

Existing related work (do not duplicate):

- IE portal shared: `apps/web/public/media/ie/portal/` + `docs/ie-image-02-provenance.json`
- International staged extras: `apps/web/public/media/international/categories/` (canonical files; **reuse, never copy into IE**)
- Older deferred 50-packs: `docs/integrated-export-image-acquisition-manifest.json` → `needsOwnerConfirmation` (`downloadAllowed: false`). This template **replaces the role list** for any pack acquired after IE-11C. Do not run those deferred downloads.

---

## 1. When a pack may be filled

1. Owner ticks **Approved** on `docs/ie-11c-owner-approval-checklist.md`.
2. Owner confirms **slug** (example: `sesame-seeds` vs `sesame`).
3. Engineering copies the blank pack in the JSON, substitutes `{slug}` / `{name}`.
4. Humans search Unsplash / Pexels / Wikimedia (Google/Bing = discovery only).
5. Only clearly licensed images are downloaded.
6. Provenance row is written **before** the file is registered in the public app.
7. Public pages stay on placeholders until a **published** commodity record exists.

Fifty images is a **ceiling** for a major approved commodity. Prefer 15 strong role shots plus a short gallery over 50 near-duplicates.

---

## 2. Recommended folder structure

Do not create these directories until a commodity is approved and at least one licensed file is ready.

```
apps/web/public/media/ie/
  portal/                          # already staged — not commodity SKUs
  commodities/                     # create only after approval
    {slug}/
      hero/
      whole/
      close-up/
      bulk/
      sacks/
      packaging/
      grading/
      quality/
      storage/
      logistics/
      loading/
      transport/
      port/
      processing/
      application/
      gallery/
docs/ie-commodities/{slug}-provenance.json
```

International remains:

```
apps/web/public/media/international/categories/{category-slug}/...
```

Never copy those 48 staged International files into `media/ie/commodities/`.

---

## 3. Filename convention

```
ie-{commodity-slug}-{role}-{nn}.webp
```

| Role key | Example (if Sesame + slug `sesame-seeds` were approved) |
|----------|---------------------------------------------------------|
| `hero` | `ie-sesame-seeds-hero-01.webp` |
| `whole` | `ie-sesame-seeds-whole-01.webp` |
| `close-up` | `ie-sesame-seeds-close-up-01.webp` |
| `bulk` | `ie-sesame-seeds-bulk-01.webp` |
| `sacks` | `ie-sesame-seeds-sacks-01.webp` |
| `packaging` | `ie-sesame-seeds-packaging-01.webp` |
| `grading` | `ie-sesame-seeds-grading-01.webp` |
| `quality` | `ie-sesame-seeds-quality-01.webp` |
| `storage` | `ie-sesame-seeds-storage-01.webp` |
| `logistics` | `ie-sesame-seeds-logistics-01.webp` |
| `loading` | `ie-sesame-seeds-loading-01.webp` |
| `transport` | `ie-sesame-seeds-transport-01.webp` |
| `port` | `ie-sesame-seeds-port-01.webp` |
| `processing` | `ie-sesame-seeds-processing-01.webp` |
| `application` | `ie-sesame-seeds-application-01.webp` |
| `gallery` | `ie-sesame-seeds-gallery-01.webp` |

`nn` is `01`…`99`. Skip numbers rather than inventing filler files.

**Do not use:** WhatsApp names (`IMG-2026…WA0001.jpg`), `download(1).jpg`, or International `intl-…` prefixes on IE files.

---

## 4. Required image roles

Acquire only roles that are **visually appropriate** for that commodity. Skip processing if the owner has not confirmed a process form.

| # | Role key | Purpose | Typical orientation |
|---|----------|---------|---------------------|
| 01 | `hero` | Catalogue / detail hero | Landscape 16:9, ≥1920px |
| 02 | `whole` | Identifiable commodity as a lot or pile | 4:3, ≥1600px |
| 03 | `close-up` | Texture / grade-readable detail | Square or 4:3, ≥1400px |
| 04 | `bulk` | Volume, not a handful | Landscape |
| 05 | `sacks` | Jute / PP bags, unmarked | Landscape |
| 06 | `packaging` | Export-style bags/cartons without competitor brands | 4:3 |
| 07 | `grading` | Sorting, sieves, inspection tables | Landscape |
| 08 | `quality` | Cleanliness / moisture context without fake lab claims | 4:3 |
| 09 | `storage` | Warehouse / silo **generic**, not “Almahbub warehouse” | Landscape |
| 10 | `logistics` | Yard, pallets, stuffing prep | Landscape |
| 11 | `loading` | Truck or container loading | Landscape |
| 12 | `transport` | Truck / rail in transit | Landscape |
| 13 | `port` | Port / vessel / containers — export context | Landscape |
| 14 | `processing` | Only if owner confirmed that form exists | Landscape |
| 15 | `application` | Food / industrial use **without** claiming Almahbub customers | 4:3 |
| — | `gallery` | Extra strong stills that do not duplicate the above | Mixed |

Suggested first-wave counts after approval (adjust; stay ≤50):

| Role | Count |
|------|------:|
| hero | 2–3 |
| whole | 3–4 |
| close-up | 3–4 |
| bulk | 2–3 |
| sacks | 2–3 |
| packaging | 2 |
| grading | 2 |
| quality | 2 |
| storage | 2 |
| logistics | 2 |
| loading | 1–2 |
| transport | 1–2 |
| port | 2 |
| processing | 0–2 |
| application | 1–2 |
| gallery | 0–8 |
| **Ceiling** | **50** |

---

## 5. Search descriptions (planning)

Replace `{name}` with the **approved** English name. Do not search using “Almahbub”.

### Generic role queries

| Role | Search description (template) |
|------|-------------------------------|
| hero | `high quality {name} agricultural export commodity product photography clean composition warehouse light` |
| whole | `whole {name} commodity lot commercial photography identifiable kernels or seeds on neutral surface` |
| close-up | `macro close up {name} texture agricultural commodity grade detail sharp focus` |
| bulk | `bulk quantity {name} piled agricultural commodity export warehouse not a handful` |
| sacks | `{name} in jute sacks bulk agricultural export bags unmarked commercial photography` |
| packaging | `{name} export packaging polypropylene bags stacked commodity trade photography no brand logos` |
| grading | `{name} grading sorting table agricultural quality control commodity inspection photography` |
| quality | `{name} quality inspection agricultural commodity clean sample close context not a laboratory claim` |
| storage | `{name} storage warehouse sacks generic agro commodity storehouse photography not a named company` |
| logistics | `{name} agro commodity logistics pallet yard stuffing preparation export photography` |
| loading | `loading {name} sacks into truck or shipping container agricultural export photography` |
| transport | `truck transporting bagged {name} agricultural commodity highway or depot photography` |
| port | `{name} export port containers bulk agro commodity shipping terminal photography` |
| processing | `{name} processing plant agricultural commodity handling generic facility photography no company name` |
| application | `{name} food or industrial use context still photography not a customer testimonial` |
| gallery | `{name} professional agricultural commodity still life natural light commercial` |

Avoid queries like `{name} image` or `{name} stock`.

### Filled queries for unverified candidates

**These are search aids only.** They do **not** approve trade or download.

#### Sesame (`sesame-seeds` if approved)

| Role | Search description |
|------|-------------------|
| hero | high quality sesame seeds in bulk sacks agricultural export warehouse photography |
| whole | raw white sesame seeds commodity lot commercial product photography identifiable seeds |
| close-up | macro close up sesame seeds texture hulled and unhulled agricultural commodity |
| bulk | large pile of sesame seeds bulk agro commodity warehouse photography |
| sacks | sesame seeds in jute sacks bulk agricultural export bags unmarked |
| packaging | sesame seeds polypropylene export bags stacked commodity photography no logos |
| grading | sesame seed grading and sorting table quality control agricultural photography |
| quality | sesame seed sample inspection clean commodity quality context photography |
| storage | bagged sesame seeds in generic agricultural warehouse storage photography |
| logistics | sesame seed sacks on pallets agro export logistics yard photography |
| loading | workers loading sesame seed bags into a shipping container export photography |
| transport | truck loaded with bagged sesame seeds agricultural commodity transport |
| port | shipping containers at port agro commodity sesame export terminal photography |
| processing | sesame seed cleaning and handling equipment generic agro processing photography |
| application | sesame seeds as food ingredient bakery or oil context still photography |
| gallery-01 | natural light sesame seeds wooden bowl commercial food photography not a brand |
| gallery-02 | mixed black and white sesame seeds overhead commodity photography |
| gallery-03 | sesame plants in field agricultural crop photography generic farm not Almahbub |
| gallery-04 | open sack spilling sesame seeds export commodity still life |
| gallery-05 | sesame oil press context generic mill photography no company branding |

#### Cashew

| Role | Search description |
|------|-------------------|
| hero | cashew nuts in shell bulk agricultural export warehouse photography |
| whole | raw cashew nuts commodity lot commercial photography identifiable kernels |
| close-up | macro cashew kernel texture agricultural commodity grade detail |
| bulk | bulk cashew nuts in pile agro export commodity photography |
| sacks | cashew nuts in jute sacks West Africa agricultural export photography |
| packaging | cashew kernels vacuum or bag export packaging unmarked photography |
| grading | cashew nut grading sorting table quality control photography |
| quality | cashew kernel colour and size inspection commodity photography |
| storage | bagged cashews generic warehouse storage agro commodity photography |
| logistics | cashew sacks palletized export logistics photography |
| loading | loading cashew bags into container agricultural export photography |
| transport | truck transport bagged cashew nuts commodity photography |
| port | cashew export shipping containers port terminal photography |
| processing | cashew nut shelling generic processing photography no factory claim |
| application | roasted cashews food ingredient context still photography |
| gallery | cashew apples and nuts agricultural crop photography generic orchard |

#### Ginger

| Role | Search description |
|------|-------------------|
| hero | dried split ginger agricultural export commodity warehouse photography |
| whole | whole ginger rhizomes commodity lot commercial photography |
| close-up | macro dried ginger texture fibre agricultural commodity |
| bulk | bulk dried ginger pile agro export photography |
| sacks | ginger in jute sacks bulk spice export photography |
| packaging | dried ginger export bags stacked unmarked commodity photography |
| grading | ginger sorting and grading table spice commodity photography |
| quality | dried ginger quality inspection moisture context photography |
| storage | bagged ginger generic spice warehouse photography |
| logistics | ginger sacks on pallets agro logistics photography |
| loading | loading ginger bags into container spice export photography |
| transport | truck carrying bagged dried ginger commodity transport |
| port | spice commodity containers at export port photography |
| processing | ginger washing or slicing generic processing photography |
| application | dried ginger culinary spice use still photography |
| gallery | fresh ginger harvest agricultural field photography generic farm |

#### Hibiscus

| Role | Search description |
|------|-------------------|
| hero | dried hibiscus calyces agricultural export commodity photography |
| whole | dried hibiscus flowers bulk commodity lot commercial photography |
| close-up | macro dried hibiscus calyx texture tea commodity |
| bulk | bulk dried hibiscus piled agro export photography |
| sacks | hibiscus in jute sacks bulk botanical export photography |
| packaging | dried hibiscus export bags unmarked commodity photography |
| grading | hibiscus sorting colour grading table photography |
| quality | dried hibiscus quality inspection botanical commodity photography |
| storage | bagged hibiscus generic warehouse botanical storage photography |
| logistics | hibiscus sacks palletized export logistics |
| loading | loading hibiscus bags into shipping container |
| transport | truck transport bagged dried hibiscus commodity |
| port | botanical commodity export port containers photography |
| processing | hibiscus drying racks generic agricultural processing |
| application | hibiscus tea brew culinary still photography not a brand |
| gallery | hibiscus sabdariffa plants agricultural field photography generic |

#### Shea

| Role | Search description |
|------|-------------------|
| hero | shea nuts bulk agricultural export warehouse photography |
| whole | raw shea nuts commodity lot commercial photography |
| close-up | macro shea nut kernel texture oilseed commodity |
| bulk | bulk shea nuts piled West Africa agro photography |
| sacks | shea nuts in jute sacks bulk export photography |
| packaging | shea kernels export bags unmarked commodity photography |
| grading | shea nut sorting grading table photography |
| quality | shea nut quality inspection oilseed commodity photography |
| storage | bagged shea nuts generic warehouse photography |
| logistics | shea sacks palletized agro export logistics |
| loading | loading shea nut bags into container export photography |
| transport | truck transporting bagged shea nuts commodity |
| port | shea nut export port containers photography |
| processing | shea butter traditional or mill processing generic no company |
| application | unrefined shea butter cosmetic or food context still photography |
| gallery | shea tree nuts harvest agricultural photography generic parkland |

#### Soybean

| Role | Search description |
|------|-------------------|
| hero | soybeans bulk agricultural export warehouse photography |
| whole | yellow soybeans commodity lot commercial product photography |
| close-up | macro soybean seed texture pulse oilseed commodity |
| bulk | large pile of soybeans grain commodity photography |
| sacks | soybeans in bulk bags agricultural export photography |
| packaging | soybean export bags stacked unmarked commodity photography |
| grading | soybean grading sieve quality control photography |
| quality | soybean sample inspection grain quality photography |
| storage | soybeans in generic silo or warehouse grain storage photography |
| logistics | soybean bags pallets agro logistics photography |
| loading | loading soybeans bulk or bagged into container or hopper |
| transport | grain truck soybeans agricultural commodity transport |
| port | soybean bulk carrier or containers export port photography |
| processing | soybean crushing mill generic oilseed processing photography |
| application | soybeans food or feed ingredient context still photography |
| gallery | soybean field agricultural crop photography generic farm |

#### Cocoa

| Role | Search description |
|------|-------------------|
| hero | cocoa beans bulk agricultural export warehouse photography |
| whole | dried cocoa beans commodity lot commercial photography |
| close-up | macro cocoa bean texture fermented dried commodity |
| bulk | bulk cocoa beans piled agro export photography |
| sacks | cocoa beans in jute sacks West Africa export photography |
| packaging | cocoa bean export bags stacked unmarked photography |
| grading | cocoa bean grading cutting test table photography |
| quality | cocoa bean quality inspection fermentation context photography |
| storage | bagged cocoa generic warehouse tropical commodity photography |
| logistics | cocoa sacks palletized export logistics photography |
| loading | loading cocoa bags into container agricultural export |
| transport | truck transport bagged cocoa beans commodity |
| port | cocoa export port bags and containers photography |
| processing | cocoa drying or winnowing generic processing photography |
| application | cocoa beans chocolate making context still photography no brand |
| gallery | cocoa pods on tree agricultural photography generic farm |

If a candidate is **Not approved**, delete that search pack; do not acquire it “just in case”.

---

## 6. Provenance requirements

Align with `docs/ie-image-02-provenance.json`. One row per file.

| Field | Required |
|-------|----------|
| `filename` | `ie-{slug}-{role}-{nn}.webp` |
| `folder` | Path under `apps/web/public/media/ie/commodities/{slug}/{role}/` |
| `commodity` | Approved display name |
| `commoditySlug` | Approved slug |
| `imageRole` | Role key |
| `source` | Unsplash / Pexels / Wikimedia Commons / other named license |
| `sourceUrl` | Canonical photo page, not a Google thumbnail |
| `downloadUrl` | Direct licensed file URL if different |
| `photographer` / `creator` | Named person or org |
| `photoId` | Platform id when available |
| `license` | e.g. Unsplash License, Pexels License, CC BY-SA 4.0 |
| `licenseUrl` | License text URL |
| `downloadDate` | ISO date of acquisition |
| `altText` | Honest description; no Almahbub ownership |
| `authenticity` | `representative` \| `contextual` \| `official` |
| `status` | `planned` \| `acquired` \| `rejected` |
| `sha256` | After download |
| `reusedExistingFile` | `true` only if pointing at an **IE portal** canonical file, never an International product file used as a commodity SKU |

**`official`** is allowed only when the owner supplies Almahbub-owned photography.

Forbidden alt/caption language unless verified:

- Almahbub facility
- Almahbub warehouse
- Almahbub farm
- Almahbub shipment
- Our factory / our farmers (as Almahbub-owned)

Use the existing caption:

> Representative imagery for illustration — not Almahbub facilities, staff, farms, or product lots.

---

## 7. Preferred sources

1. Unsplash  
2. Pexels  
3. Wikimedia Commons (check license + attribution)  
4. Other **named** licenses with a stable URL  

Google / Bing: **discovery only**. Do not save a search-result thumbnail.

WhatsApp dump: **out of scope**.

---

## 8. Exact next steps after approval

1. Owner returns `docs/ie-11c-owner-approval-checklist.md` with ticks and slugs.  
2. Engineering creates **draft** Ops CMS rows **only** for Approved names (still unpublished unless “Approved for publication” is Yes).  
3. For each approved name, copy the JSON pack, set `downloadAllowed: true` only after a licensed candidate is chosen.  
4. Download WebP into the folder for that role; write provenance.  
5. Register media on the draft commodity (`heroMedia` / `gallery` paths). Leave empty rather than assigning random stock.  
6. Publish only records the owner marked for publication.  
7. Do not invent specifications, markets, certifications, prices, quantities, or destinations. Empty fields stay empty.

**STOP** for image download until a licensed file is selected per role. Draft CMS rows are authorized by the returned checklist.
