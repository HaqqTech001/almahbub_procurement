# Integrated Export & International — Image Acquisition Manifest

**Phase:** IE-IMAGE-01  
**Purpose:** Acquisition planning only. Do **not** download into production folders until you are ready; do **not** import/map in this phase.  
**Machine-readable companion:** [`integrated-export-image-acquisition-manifest.json`](./integrated-export-image-acquisition-manifest.json)

---

## Critical audit findings

| Fact | Repository evidence |
|------|---------------------|
| **Verified IE commodities** | **None.** `IE_COMMODITY_RECORDS = []` in `apps/web/src/integrated-export/commodities/store.ts` |
| **Verified IE market countries** | **None.** `IE_MARKET_RECORDS = []` |
| **Suggested commodity names** | ginger, hibiscus, sesame, cashew, shea, soybean, cocoa — appear only as **disabled candidates** in `docs/integrated-export-experience-audit.md` |
| **IE structured categories** | **None** (optional free-text `category` on commodity type only) |
| **International categories** | Authoritative V1 list in `apps/api/src/modules/catalog/domain/v1-taxonomy.ts` (5 categories) |

**Therefore:** a 50-image pack is **not** authorized for download for any named IE commodity until the owner confirms the published list. Deferred packs exist in JSON under `needsOwnerConfirmation` with `downloadAllowed: false`.

---

## Domains (strict separation)

### A. Almahbub Integrated Export

- Paths under `apps/web/public/media/ie/`
- Portal shared + future `commodities/[slug]/`
- **Never** place IE agro media into International Product catalogue

### B. Almahbub International

- Paths under `apps/web/public/media/international/`
- V1 categories only for category illustration gaps
- Product SKU photography must follow **published Product** records (not invented here)

---

## 1. Verified IE commodities

**None.**

## 2. IE categories

**None structured.** Homepage capability themes (copy only): Commodities, Bulk supply, Export — not catalogue categories.

## 3. NEEDS OWNER CONFIRMATION (IE)

Do **not** create commodity folders. Do **not** download these packs yet.

| Candidate | Slug (if approved) | Mentions in repo | Status |
|-----------|--------------------|------------------|--------|
| Sesame | `sesame` | Audit doc candidates | Unconfirmed |
| Cashew | `cashew` | Audit doc candidates | Unconfirmed |
| Ginger | `ginger` | Audit doc candidates | Unconfirmed |
| Hibiscus | `hibiscus` | Audit doc candidates | Unconfirmed |
| Shea | `shea` | Audit doc candidates | Unconfirmed |
| Soybean | `soybean` | Audit doc candidates | Unconfirmed |
| Cocoa | `cocoa` | Audit doc candidates | Unconfirmed |

When confirmed, each gets **50** assets:

| Role | Count |
|------|------:|
| Hero / premium presentation | 10 |
| Raw / product appearance | 10 |
| Close-up / detail | 10 |
| Packaging | 5 |
| Handling / sourcing context | 5 |
| Logistics / export context | 5 |
| Alternate compositions | 5 |
| **Total** | **50** |

Full per-image records (IDs, queries, filenames, folders, alt, authenticity) are in the JSON under `integratedExport.needsOwnerConfirmation[].images`.

---

## 4. Images currently available

### Integrated Export (raster)

| File | Registered in `IE_PROCESS_MEDIA` | Kind |
|------|----------------------------------|------|
| `apps/web/public/media/ie/process-hero-port.jpg` | Yes | Representative |
| `apps/web/public/media/ie/process-sourcing-beans.jpg` | Yes | Representative |
| `apps/web/public/media/ie/process-quality-beans.jpg` | Yes | Representative |
| `apps/web/public/media/ie/process-documentation.jpg` | Yes | Representative |
| `apps/web/public/media/ie/process-logistics-ship.jpg` | Yes | Representative |
| `apps/web/public/media/ie/process-logistics-port.jpg` | **No** (orphan on disk) | — |
| `apps/web/public/media/ie/process-spec-beans.jpg` | **No** (orphan on disk) | — |

**Total IE raster on disk: 7** (5 registered + 2 unregistered).

Used on Process / Quality / Markets / About. Homepage hero currently uses a **placeholder mark**, not a photo (`mediaLabel`: approved imagery forthcoming).

### Almahbub International (category raster)

| Category | Slug | Existing file |
|----------|------|---------------|
| iPhones & Gadgets | `iphones-gadgets` | `.../category-iphones-gadgets.jpg` |
| Medical Equipments | `medical-equipments` | `.../category-medical-equipments.jpg` |
| Home & Garden Wares | `home-garden-wares` | `.../category-home-garden-wares.jpg` |
| Machineries | `machineries` | `.../category-machineries.jpg` |
| General Procurement | `general-procurement` | `.../category-general-procurement.jpg` |

**Total International category raster: 5** (1 per V1 category). All `kind: representative` (Unsplash).

### Legacy illustrative SVGs (International / general site)

Under `apps/web/public/media/*.svg` (e.g. `category-industrial.svg`, `product-electrical.svg`, partners). Separate from V1 category photography; not IE commodities.

---

## 5. Images missing (actionable now)

### A. IE portal shared (download allowed) — **10 assets — P0/P1/P2**

Acquire into `apps/web/public/media/ie/portal/...` using filenames below. Prefer **WebP**. Keep provenance sidecar notes (URL, creator, license, date).

| ID | Priority | Filename | Folder | Primary search |
|----|----------|----------|--------|----------------|
| IE-PORTAL-HOME-HERO-001 | P0 | `ie-portal-home-hero-01.webp` | `ie/portal/hero/` | `african agro commodity export commercial photography clean composition` |
| IE-PORTAL-HOME-HERO-002 | P1 | `ie-portal-home-hero-02.webp` | `ie/portal/hero/` | `shipping containers agricultural export port photography` |
| IE-PORTAL-CAP-COMMODITIES-001 | P0 | `ie-portal-capability-commodities-01.webp` | `ie/portal/capabilities/` | `mixed agro commodities seeds nuts spices product photography` |
| IE-PORTAL-CAP-BULK-001 | P0 | `ie-portal-capability-bulk-01.webp` | `ie/portal/capabilities/` | `bulk jute sacks agricultural commodities warehouse photography` |
| IE-PORTAL-CAP-EXPORT-001 | P0 | `ie-portal-capability-export-01.webp` | `ie/portal/capabilities/` | `container ship export logistics aerial photography` |
| IE-PORTAL-PROCESS-ENQUIRY-001 | P1 | `ie-portal-process-enquiry-01.webp` | `ie/portal/process/` | `business meeting reviewing documents commercial photography` |
| IE-PORTAL-QUALITY-001 | P1 | `ie-portal-quality-detail-01.webp` | `ie/portal/quality/` | `agro commodity quality inspection close up no lab claims` |
| IE-PORTAL-MARKETS-001 | P1 | `ie-portal-markets-reach-01.webp` | `ie/portal/markets/` | `global trade shipping logistics commercial photography` |
| IE-PORTAL-ABOUT-001 | P2 | `ie-portal-about-01.webp` | `ie/portal/about/` | `agro commodity trade business photography professional` |
| IE-PORTAL-CONTACT-001 | P2 | `ie-portal-contact-01.webp` | `ie/portal/contact/` | `professional business correspondence desk photography` |

Full fields (alt, avoid, aspect, authenticity) → JSON `integratedExport.portalSharedAcquisition`.

**Authenticity:** all stock → `REPRESENTATIVE` or `CONTEXTUAL`. Never label as Almahbub farm/warehouse/staff/shipment.

### B. International category depth (download allowed) — **75 assets (+15 × 5 categories)**

**Why not 50 per category:** category illustration needs quality depth, not repetitive filler. Product detail media belongs to published SKUs (out of scope for invention).

Per category roles: 3 hero + 4 product + 3 close-up + 3 alternate + 2 context = **15**.

Example filenames:

- `intl-iphones-gadgets-hero-01.webp`
- `intl-medical-equipments-product-02.webp`
- `intl-machineries-closeup-01.webp`
- …

Folders:

```text
apps/web/public/media/international/categories/[slug]/hero|gallery|context/
```

Full records → JSON `international.gapManifest`.

### C. Deferred IE commodity packs — **350 slots (7 × 50)**

See JSON. `downloadAllowed: false` until owner confirmation.

---

## 6. Fifty-image target per major commodity

| Commodity | Target | Status |
|-----------|-------:|--------|
| *(none verified)* | — | N/A |
| Each confirmed candidate | 50 | Deferred packs ready in JSON |

**Why IE portal does not get 50 “fake commodity” images:** that would invent catalogue identity. Portal shared uses **10** purposeful assets instead.

---

## 7. Priority breakdown

| Priority | Scope | Count (now) |
|----------|--------|------------:|
| P0 | IE homepage hero + 3 capability cards; International category heroes/products | See JSON |
| P1 | IE process/quality/markets extras; International close-ups/alts | See JSON |
| P2 | IE about/contact polish | 2 portal |

P0 before catalogue launch also includes **owner-confirmed commodity heroes + card images** (deferred until confirmation).

---

## 8. Search-query summary (examples)

**IE portal**

- `premium agricultural commodities still life commercial hero`
- `bulk jute sacks agricultural commodities warehouse photography`
- `container ship export logistics aerial photography`

**IE candidate (after confirmation) — Sesame example**

- `premium sesame seeds commercial product photography white background`
- `raw sesame commodity bulk appearance commercial photography`
- `sesame close up texture detail macro photography`
- `sesame in jute sack bulk packaging commercial photography`

**International — iPhones & Gadgets**

- `premium smartphone product photography white background commercial`
- `smartphone gadgets flat lay commercial photography`

(All alternatives live in JSON.)

---

## 9. Folder structure

### Create when downloading portal / International gaps

```text
apps/web/public/media/ie/portal/
  hero/
  capabilities/
  process/
  quality/
  markets/
  about/
  contact/

apps/web/public/media/international/categories/
  iphones-gadgets/{hero,gallery,context}/
  medical-equipments/{hero,gallery,context}/
  home-garden-wares/{hero,gallery,context}/
  machineries/{hero,gallery,context}/
  general-procurement/{hero,gallery,context}/
```

### Create **only after** owner confirms commodities

```text
apps/web/public/media/ie/commodities/[slug]/
  hero/
  gallery/
  packaging/
  context/
  logistics/
```

---

## 10. Filename convention

| Domain | Pattern | Example |
|--------|---------|---------|
| IE portal | `ie-portal-[section]-[role]-[nn].webp` | `ie-portal-home-hero-01.webp` |
| IE commodity | `ie-[slug]-[role]-[nn].webp` | `ie-sesame-hero-01.webp` |
| International | `intl-[category-slug]-[role]-[nn].webp` | `intl-machineries-product-01.webp` |

**Do not use:** `IMG_3928.jpg`, WhatsApp names, `download(1).jpg`.

Validation list of allowed-now vs deferred filenames: JSON `validationIndex`.

---

## 11. Licensing requirements

For every downloaded file, keep a note (sidecar `.txt` or spreadsheet) with:

1. Source URL  
2. Creator / photographer (if available)  
3. License name + URL  
4. Download date  
5. Attribution requirement (if any)  

**Preferred sources:** Unsplash, Pexels, Wikimedia Commons, clear open/government licenses, manufacturer media with explicit permission.

**Google Images:** discovery only — do not treat search-result thumbnails as licensed originals.

**Authenticity labels for later import:**

| Label | Meaning |
|-------|---------|
| PRODUCT | Shows the commodity/product itself (still not “official Almahbub lot” unless owner photo) |
| REPRESENTATIVE | Licensed stock used for illustration |
| CONTEXTUAL | Handling/logistics atmosphere — never “our warehouse” |

Caption already in product: `REPRESENTATIVE_MEDIA_CAPTION` in `media-assets.ts`.

---

## 12. Image count summary

| Domain | Category / Commodity | Existing | Needed (now) | Target notes |
|--------|----------------------|----------|--------------|--------------|
| IE | Verified commodities | 0 | 0 | Empty store |
| IE | Portal shared | 0 dedicated | **10** | Homepage + sections |
| IE | Process (existing) | 7 | 0 required | Register orphans later |
| IE | Sesame…Cocoa (candidates) | 0 | **0 now / 50 each later** | Owner confirmation |
| International | iPhones & Gadgets | 1 | **15** | Not 50 |
| International | Medical Equipments | 1 | **15** | Not 50 |
| International | Home & Garden Wares | 1 | **15** | Not 50 |
| International | Machineries | 1 | **15** | Not 50 |
| International | General Procurement | 1 | **15** | Not 50 |

| Metric | Count |
|--------|------:|
| **TOTAL IE IMAGES NEEDED (now)** | **10** |
| **TOTAL IE IMAGES DEFERRED (candidates × 50)** | **350** |
| **TOTAL INTERNATIONAL IMAGES NEEDED** | **75** |
| **TOTAL CURRENT IE RASTER** | **7** |
| **TOTAL CURRENT INTERNATIONAL CATEGORY RASTER** | **5** |
| **TOTAL MISSING (actionable now)** | **85** (10 + 75) |

---

## 13. Selection rules (reminder)

**Prefer:** high resolution, sharp, commercial, natural, no watermarks, no unrelated brands, crop-friendly, clear subject.

**Avoid:** AI-looking fakes, competitor logos, screenshots, unclear provenance, misleading facilities, wording that implies Almahbub owns farms/factories/warehouses.

---

## 14. Generated files

| File | Role |
|------|------|
| `docs/integrated-export-image-acquisition-manifest.md` | Human acquisition guide |
| `docs/integrated-export-image-acquisition-manifest.json` | Structured records + filename validation index |
| `scripts/generate-ie-image-manifest.mjs` | Regenerator (optional) |

**Not modified:** IE UI, commodities store, products, schema, APIs, Ops.

---

## 15. Owner confirmation checklist

1. Which commodities (if any) from the candidate list may be **published**?  
2. Any commodities **not** in the candidate list that should be added?  
3. Official Almahbub photography available (vs representative stock only)?  
4. Confirm WhatsApp merchandise dump remains **out of scope** for IE (per prior audit).  
5. After confirmation: create `ie/commodities/[slug]/` folders and download deferred 50-packs.

---

## STOP

Do **not** proceed to downloading/importing in this phase beyond your personal sourcing workflow. A later Cursor phase will import and map files that match `validationIndex.allowedFilenamesNow` (and deferred names only after owner approval).
