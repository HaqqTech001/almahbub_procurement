# IE-11C — Integrated Export commodity candidate list

**Date:** 2026-08-17  
**Rule:** A search hit or earlier AI suggestion is **not** proof that Almahbub trades that commodity.  
**Publication:** Owner approved the seven names for **public catalogue publication** on 2026-08-17 (enquiry-led, no prices).

Owner decision (2026-08-17): **Published** — Sesame Seeds (`sesame-seeds`), Cashew, Ginger, Hibiscus, Shea, Soybean, Cocoa. Public store: `IE_COMMODITY_RECORDS`. Ops CMS rows published via `seed:ie-publish`. Licensed representative media staged under `apps/web/public/media/ie/commodities/`.

Related sources inspected:

- `apps/web/src/integrated-export/commodities/store.ts` (`IE_COMMODITY_RECORDS = []`)
- `database/prisma/migrations/20260817140000_integrated_export_commodity/migration.sql` (schema only; **no seed rows**)
- `docs/integrated-export-experience-audit.md`
- `docs/integrated-export-image-acquisition-manifest.md` / `.json`
- `apps/web/src/content/group.ts` (IE portal copy)
- `apps/web/src/content/media-assets.ts` (`IE_DEFERRED_COMMODITY_SLUGS`)
- `scripts/generate-ie-image-manifest.mjs`
- `docs/ie-image-02-provenance.json` (portal + International only)
- `docs/product-media-mapping-report.md` (WhatsApp dump)
- V1 `client-frontend/` (no named agro SKUs)
- International V1 taxonomy (`iphones-gadgets`, `medical-equipments`, `home-garden-wares`, `machineries`, `general-procurement`) — **not IE commodities**

---

## Established facts (not named SKUs)

These are verified **capability claims**, not a commodity catalogue:

| Claim | Evidence |
|-------|----------|
| IE is a distinct Group business for agro commodities, bulk supply, and export | `group.ts` hero, capabilities, about |
| Specific SKUs and grades are enquiry-led | `group.ts` commodities + quality/markets empty states |
| Public IE catalogue is empty | `IE_COMMODITY_RECORDS = []`; tests assert sesame/cashew/ginger/hibiscus/cocoa are **not** shown on the buyer host |
| Prisma model exists; seven **unpublished** drafts after owner approval | Seed: `database/prisma/seed/ie-owner-approved-commodity-drafts.json` (`published: false`) |
| Portal shared imagery is representative Unsplash, not named lots | `IE_PORTAL_MEDIA`; caption forbids Almahbub facilities/farms |
| WhatsApp merchandise dump is **out of scope** for IE | Laptops, bottles, stoves — `integrated-export-experience-audit.md` §media |

---

## A. Explicitly established in existing Almahbub material

**Named commodities: none.**

No owner letter, seed, published record, invoice, quotation, or V1 page names a tradeable IE SKU.

Do not treat the homepage hero subject line “spice/commodity assortment” as a published spice list. That is a **representative photo caption**, not a catalogue.

---

## B. Mentioned but not sufficiently verified

These seven names appeared as **disabled / unconfirmed candidates**. The owner approved them as **draft CMS rows** on 2026-08-17. They must not be published from this mention.

| Candidate | Suggested slug (editable) | Suggested category (unconfirmed free text) | Where mentioned | What the mention actually is |
|-----------|---------------------------|--------------------------------------------|-----------------|------------------------------|
| Sesame | `sesame-seeds` (also `sesame` in older deferred lists) | Oilseeds | Experience audit; image manifest; `IE_DEFERRED_COMMODITY_SLUGS`; tests that **forbid** display | Suggested candidate |
| Cashew | `cashew` | Tree nuts | Same | Suggested candidate |
| Ginger | `ginger` | Spices / roots | Same | Suggested candidate |
| Hibiscus | `hibiscus` | Botanicals | Same | Suggested candidate |
| Shea | `shea` | Oilseeds / kernels | Same | Suggested candidate |
| Soybean | `soybean` | Oilseeds / pulses | Same | Suggested candidate |
| Cocoa | `cocoa` | Cocoa | Same | Suggested candidate |

**Confidence:** Low. Repeated in docs/code as a waiting list, never as an approved published set.

Older image packs used slug `sesame`. This phase’s filename examples use `sesame-seeds`. **Owner must pick the slug** if Sesame is approved.

---

## C. Previously suggested only

The B list **originated** as suggestions in `docs/integrated-export-experience-audit.md` §14 (“List: ginger, hibiscus, sesame, cashew, shea, soybean, cocoa, other.”).

No additional named commodities were found that exist only in prior AI research outside that list.

Tests exist specifically so those names **cannot leak** into the public UI (`IeHomePage.test.tsx`, `IeCommodityPages.test.tsx`, `commodities.test.ts`, Ops CMS test).

---

## D. Unknown

Not present as IE candidates in this repository (do not add unless the owner writes them in):

Groundnut / peanut, millet, sorghum, maize, cotton, palm kernel, chili, garlic, turmeric, gum arabic, charcoal, or any other West African export staple.

The audit ellipsis (“cocoa, …”) is **not** a list.

---

## International isolation

Do **not** map International Products or the 48 staged International category images onto IE commodities.

| Domain | Path | Status |
|--------|------|--------|
| IE portal shared | `apps/web/public/media/ie/portal/` | Representative; already staged |
| IE commodities | `apps/web/public/media/ie/commodities/` | **Must not exist until licensed acquisition** (name approval alone is not enough) |
| International | `apps/web/public/media/international/` | Canonical; reuse files, never copy into IE |

---

## What this document authorizes

Discovery classification. Owner ticks live on `docs/ie-11c-owner-approval-checklist.md`.

It does **not** authorize:

- Public catalogue cards
- Image download
- Specifications, markets, certifications, prices, quantities, or destinations
- Publishing the seven drafts
