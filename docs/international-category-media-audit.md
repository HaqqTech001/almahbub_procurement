# International category media audit

Date: 2026-08-18  
Scope: Almahbub International V1 categories only. Integrated Export commodity and portal media were not modified.

All stock photography below is **representative / contextual illustration**. None of it is Almahbub inventory, staff, facilities, or owned equipment.

## Surfaces that currently consume category media

| Surface | Selector | Image used before this pass |
| --- | --- | --- |
| Homepage category cards | `getInternationalCategoryMedia(slug)` | `/media/international/category-{slug}.jpg` |
| `/products` empty-state category cards | same | same |
| Staged extras | `listInternationalStagedMedia(slug)` | WebPs under `categories/{slug}/` — **not wired as heroes** |

## Category records

### 1. iPhones & Gadgets (`iphones-gadgets`)

| Field | Finding |
| --- | --- |
| **Current card image** | `/media/international/category-iphones-gadgets.jpg` |
| **Source** | Unsplash `photo-1511707171634-5f897ff02aa9` |
| **Suitable** | **Yes** (hero) |
| **Reason** | Clean commercial still of a modern smartphone with a laptop edge. Communicates consumer electronics without a large hardware logo claim. |
| **Replacement needed** | **No** for the hero. Gallery/context extras need cleanup. |
| **Recommended subjects** | Smartphones, tablets/laptops, watches, headphones, cameras, accessory stills. Avoid brand-store hero shots. |

**Staged extras:** Several files were remapped to unrelated Unsplash IDs (food, clothing retail, office interiors). Those are **not** gadgets and must not remain mapped.

### 2. Medical Equipments (`medical-equipments`)

| Field | Finding |
| --- | --- |
| **Current card image** | `/media/international/category-medical-equipments.jpg` |
| **Source** | Unsplash `photo-1585435557343-3b092031a831` (registry claimed a stethoscope; the file on disk is **pills, blister packs, a mask, and a thermometer** on yellow) |
| **Suitable** | **No** as hero |
| **Reason** | The category is **equipment**. Pharmaceuticals and consumables do not communicate diagnostic/hospital/lab devices. |
| **Replacement needed** | **Yes** — equipment-focused hero. The current still may be retained only as supporting medical-supplies context, not as the category face. |
| **Recommended subjects** | Monitors, ultrasound/diagnostic devices, examination equipment, lab instruments. Avoid doctors/patients as the primary subject. Avoid certification or hospital-ownership claims. |

**Staged extras:** Several “remapped verified Unsplash id” records point at office/people photography. Unsuitable.

### 3. Home & Garden Wares (`home-garden-wares`)

| Field | Finding |
| --- | --- |
| **Current card image** | `/media/international/category-home-garden-wares.jpg` |
| **Source** | Unsplash `photo-1416879595882-3373a0480b5b` |
| **Suitable** | **Partial** — garden tools only |
| **Reason** | Strong garden-wares still (trowel, soil, shears, planter). It does **not** show home furniture, kitchenware, or household wares, so it is incomplete as the sole hero. |
| **Replacement needed** | **Yes** for hero (home + garden mix). **Keep** this file as a garden gallery/context image. |
| **Recommended subjects** | Furniture, kitchenware, home décor, garden tools, outdoor/garden supplies. Do not make the whole set furniture-only or plants-only. |

**Staged extras:** Remapped IDs include industrial/city/food photographs. Unsuitable.

### 4. Machineries (`machineries`)

| Field | Finding |
| --- | --- |
| **Current card image** | `/media/international/category-machineries.jpg` |
| **Source** | Registry: Unsplash `photo-1565043666747-69f6646db940` (claimed industrial machinery) |
| **Suitable** | **No** |
| **Reason** | The file on disk is a **Mazda passenger-car dealership row** (“Certified Pre-Owned”), not industrial, construction, manufacturing, or power equipment. |
| **Replacement needed** | **Yes**. Do not reuse this file in International category media. |
| **Recommended subjects** | Factory/CNC/industrial machines, construction/heavy equipment, manufacturing lines. Prefer machines, not workers posing beside them. |

### 5. General Procurement (`general-procurement`)

| Field | Finding |
| --- | --- |
| **Current card image** | `/media/international/category-general-procurement.jpg` |
| **Source** | Unsplash `photo-1586528116311-ad8dd3c8310d` |
| **Suitable** | **Yes** (hero) |
| **Reason** | Organised warehouse aisles with mixed boxed/binned goods. Communicates sourcing/fulfilment without implying a named Almahbub inventory or duplicating machinery. |
| **Replacement needed** | **No** for the hero. Expand gallery/context with packaged goods, inspection, and mixed commercial products — not more factory machines. |
| **Recommended subjects** | Warehousing, packaged goods, sourcing/fulfilment, inspection of commercial products. |

## Cross-cutting defects

1. Card UI used a **single JPG per category**. Staged WebPs were not the card hero, and many WebPs were **wrong-subject remaps**.
2. Provenance on remapped extras is not trustworthy (`subject: "remapped verified Unsplash id"`).
3. Alt text on extras is generic (“Representative imagery for {Category} (hero)”) rather than subject-specific.
4. No dedicated International validator equivalent to the IE staging validator.

## Acquisition plan

| Category | Keep | Replace / drop | Acquire |
| --- | --- | --- | --- |
| iPhones & Gadgets | Hero JPG (convert to canonical WebP) | Remapped extras | 6–8 gadget stills |
| Medical Equipments | Optional supplies still as context only | Current hero; remapped extras | Equipment hero + 5–8 device stills |
| Home & Garden Wares | Garden JPG as gallery | Current hero as sole face; remapped extras | Homewares/furniture/kitchen hero + mixed gallery |
| Machineries | None of the car JPG | Car JPG + thin extras | Industrial/construction hero + 5–8 machine stills |
| General Procurement | Warehouse JPG as hero | — | Packaged-goods / sourcing stills, not machinery dupes |
