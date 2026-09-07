# Almahbub product-media mapping report

**Source folder:** `almahbub-product-media/`  
**Generated:** 2026-08-15  
**Rule applied:** Do not guess. Do not invent products. Do not attach media to unrelated test fixtures.

---

## Inventory

| Location | Contents |
|---|---|
| `images/` | **335** JPEG (`.jpg`) + **7** MP4 files misplaced here |
| `videos/` | **7** MP4 files (same basenames as the MP4s under `images/`) |
| Manifest / mapping CSV | **None** |
| Product-named subfolders | **None** |

**Unique basenames:** 342  
**Supported types present:** JPEG, MP4  
**Rejected types present:** none observed (no exe/pdf/docx in this tree)

**Filename pattern:** WhatsApp exports (`IMG-YYYYMMDD-WAxxxx.jpg`, `VID-YYYYMMDD-WAxxxx.mp4`). Filenames carry **no product name, SKU, or slug**.

**Video note:** Each of the 7 videos exists twice (once under `images/`, once under `videos/`). Import must use **`videos/` only** and treat `images/*.mp4` as duplicates to skip.

---

## Catalogue products currently in the database

Queried live via Prisma (`createDatabaseClient`). Result:

| Name | Slug | Status | Images |
|---|---|---|---|
| Phase6A Test Bed … | `phase6a-test-bed-*` (×5) | **archived** | 1 each |
| Phase6B Media … | `phase6b-media-*` (×1) | **archived** | 1 |

**Published / draft real catalogue products:** **0**

These Phase 6A/6B rows are automated test artefacts, not Almahbub International sellable products. They must **not** receive this media dump.

---

## Spot-check of media content (visual sample only)

Sample files were inspected to confirm the dump is real merchandise photography, not empty placeholders:

| Filename | Observed subject (content only) | Matchable DB product? |
|---|---|---|
| `IMG-20260806-WA0006.jpg` | Q-jiko charcoal stove + retail box | **No** — no Q-jiko product in DB |
| `IMG-20260217-WA0013.jpg` | HP silver laptop (closed lid) | **No** — no HP laptop product in DB |
| `IMG-20260722-WA0001.jpg` | HERO / JOIN sports water bottles | **No** — no bottle product in DB |
| `IMG-20260315-WA0006.jpg` | Dell XPS lid detail | **No** — no XPS product in DB |
| `IMG-20260526-WA0006.jpg` | MacBook Pro 16" (About This Mac) | **No** — no MacBook product in DB |

Videos were not frame-inspected; filenames alone do not identify a product.

---

## Mapping table (required format)

Because filenames do not encode products and **no real catalogue products exist**, every asset is unmatched.

### Representative rows

| filename | suspected product | media type | intended position | confidence |
|---|---|---|---|---|
| `IMG-20260806-WA0006.jpg` | UNKNOWN (content suggests Q-jiko stove) | image | UNMATCHED | **LOW** |
| `IMG-20260217-WA0013.jpg` | UNKNOWN (content suggests HP laptop) | image | UNMATCHED | **LOW** |
| `IMG-20260722-WA0001.jpg` | UNKNOWN (content suggests HERO bottles) | image | UNMATCHED | **LOW** |
| `IMG-20260315-WA0006.jpg` | UNKNOWN (content suggests Dell XPS) | image | UNMATCHED | **LOW** |
| `IMG-20260526-WA0006.jpg` | UNKNOWN (content suggests MacBook Pro) | image | UNMATCHED | **LOW** |
| `VID-20260103-WA0008.mp4` | UNKNOWN | video | UNMATCHED | **LOW** |
| `VID-20260109-WA0011.mp4` | UNKNOWN | video | UNMATCHED | **LOW** |
| `VID-20260113-WA0023.mp4` | UNKNOWN | video | UNMATCHED | **LOW** |
| `VID-20260125-WA0009.mp4` | UNKNOWN | video | UNMATCHED | **LOW** |
| `VID-20260407-WA0021.mp4` | UNKNOWN | video | UNMATCHED | **LOW** |
| `VID-20260517-WA0074.mp4` | UNKNOWN | video | UNMATCHED | **LOW** |
| `VID-20260813-WA0066.mp4` | UNKNOWN | video | UNMATCHED | **LOW** |
| `images/VID-*.mp4` (7 files) | — | video | **REJECT duplicate path** | — |
| All remaining `IMG-*.jpg` (~330) | UNKNOWN | image | UNMATCHED | **LOW** |

### Summary counts

| Bucket | Count | Action |
|---|---|---|
| **HIGH confidence match** | **0** | — |
| **UNMATCHED** | **335 JPEG + 7 unique MP4** | Hold — manual product mapping required |
| **Rejected / skip** | **7** (`images/*.mp4` duplicates of `videos/*`) | Do not import twice |
| **Imported** | **0** | Blocked |

Full per-file enumeration of all 335 JPEGs would repeat the same UNMATCHED row; listing every WhatsApp name does not add confidence without a product map.

---

## Blockers (honest)

1. **BLOCKED — no real products** to attach media to.  
2. **BLOCKED — no mapping file** tying WhatsApp filenames to product IDs/slugs.  
3. **BLOCKED — durable production storage credentials** still not configured (Phase 6B). Local driver OK for development only.  
4. Visual content alone is **insufficient** for HIGH-confidence assignment when multiple laptop / bottle / appliance photos exist without Ops confirmation.

---

## What is still allowed next (without inventing products)

Architecture work can proceed independently of import:

1. Add `ProductVideo` (or `ProductMedia`) + Prisma migration  
2. Extend catalog media store / public router / upload validation for MP4  
3. Ops Images vs Videos UI  
4. Public detail gallery + optional “Video available” on cards  
5. Security / responsive / axe tests  

**Import** must wait until Ops creates (or confirms) real draft/published products and supplies an explicit map, e.g.:

```text
IMG-20260806-WA0006.jpg → productSlug=q-jiko-super-charcoal-stove → primary
VID-20260813-WA0066.mp4 → productSlug=... → video
```

---

## Stop

No media has been imported. No fake products were created. No catalogue metadata was changed from filenames.
