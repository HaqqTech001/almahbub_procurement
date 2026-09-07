# Almahbub Integrated Export — Experience Audit

**Date:** 2026-08-16  
**Scope:** Architecture and information-architecture audit only. No implementation in this document’s accompanying sprint until owner decisions below are resolved.  
**Rule:** Do not invent commodities, prices, stock, certifications, markets, or statistics.

---

## Executive verdict

Almahbub Integrated Export Ltd. (IE) today is a **correctly bounded single-page business portal** inside the V2 web app. It has its own chrome, brand tokens, and hash navigation. It is **not** yet a multi-page B2B agro-export site.

| Claim | Status |
|---|---|
| Distinct IE experience (not International chrome) | **PASS** |
| Group relationship discoverable | **PASS** |
| Multi-page commodity / export / quote IA | **MISSING** |
| Real IE commodity records | **NONE** |
| IE-specific quote API | **MISSING** |
| Safe reuse of International `Product` catalogue for agro commodities | **NOT RECOMMENDED without owner decision** |

**STOP condition met:** several backend and content decisions require owner approval before incremental implementation can proceed without inventing data or polluting International catalogue.

---

## 1. Current architecture

### Brand hierarchy (already expressed in content)

```
Almahbub Group
├── Almahbub International  → general procurement / sourcing website
└── Almahbub Integrated Export Ltd. → agro commodities / bulk supply / export
```

Source of truth: `apps/web/src/content/group.ts`.

### Mounting

| Surface | Route | Shell |
|---|---|---|
| International public site | Most public routes | `PublicLayout` → GlobalHeader + GlobalFooter |
| IE portal | `/businesses/almahbub-integrated-export` | `RootLayout bare` → **IE owns chrome** |
| International business profile | `/businesses/almahbub-international` | Inside International layout |
| IE slug via `/businesses/:slug` | Redirects to dedicated IE portal | `BusinessPage` + `isIntegratedExportSlug` |

Key files:

- `apps/web/src/App.tsx` — IE top-level route
- `apps/web/src/integrated-export/IntegratedExportPortalPage.tsx` — **only** IE page
- `apps/web/src/styles/integrated-export-portal.css` — IE chrome
- `apps/web/src/content/group.ts` — copy, nav, brand CSS vars
- `apps/web/src/components/GroupBusinessSwitcher.tsx` — Group discovery
- `apps/web/src/app/SpaLinkInterceptor.tsx` — IE navigation/scroll hardening
- `apps/web/e2e/integrated-export-navigation.spec.ts` — portal entry / chrome guards

### Visual identity

Provisional agro/export palette (`INTEGRATED_EXPORT_BRAND`): deep green + warm earth, distinct from International blue. Official logo path is `null` (typographic wordmark + provisional “IE” mark). Owner may replace brand assets later without a second React app (`data-business="almahbub-integrated-export"`).

### Shared infrastructure (safe to keep sharing)

- Same React SPA, auth session, API host
- ThemeProvider (light/dark)
- SEO helpers, toast patterns, form controls
- Catalog media store architecture (images/videos) for **when** IE has real records
- Procurement lifecycle / `publicCode` **if** owner chooses to connect export enquiries into V2 requests (see decisions)

---

## 2. Current routes

| Route | Renders | Status |
|---|---|---|
| `/businesses/almahbub-integrated-export` | `IntegratedExportPortalPage` | **Live** single page |
| Hash `#portal-home`, `#commodities`, `#bulk-supply`, `#export`, `#about`, `#contact` | Same page | **Live** anchors |
| Nested IE paths (`/commodities`, `/export-process`, …) | — | **Not registered** |
| Enquire CTA | `/contact` (International) | **Live but wrong brand for target IA** |

There are **no empty nested IE routes** by deliberate design (“No empty placeholder routes” in `INTEGRATED_EXPORT_PORTAL`). Placeholders are content/media honesty, not dead URLs.

---

## 3. Current UI

### Single-page portal sections

1. Hero — business name + enquiry / Group CTAs  
2. Commodities — capability narrative only (no SKU list)  
3. Bulk Supply — volume/spec clarification narrative  
4. Export — export enquiry narrative  
5. About — separate registration + Group switcher  
6. Contact — routes to International `/contact` with explicit note that catalogues / trade workspace / export docs are **not** offered yet  

### Navigation (current)

Home · Commodities · Bulk Supply · Export · About · Contact — all **hash links**.

Mobile: hamburger + drawer + Escape (usable foundation; target IA needs full page routes + focus-trap/backdrop polish when expanded).

### Honesty already in product copy

- No fake SKUs/grades  
- “Approved imagery forthcoming” media labels  
- Explicit note that IE offerings are **not** in the International catalogue  
- Contact states portal foundation only  

---

## 4. Reusable components

| Capability | Location | Reuse for IE target |
|---|---|---|
| Button / Container / Field / Toast | `@hamd/ui` + web FormControls | **Yes** — primitives |
| Group switcher | `GroupBusinessSwitcher` | **Yes** — discovery |
| ProductCard / ProductGallery | `@hamd/ui/catalog` | **UI shell only** — must not imply International catalogue |
| Public catalog API `/api/v1/products` | Catalog module | **Do not** expose as IE commodities without business scoping |
| Ops Products + media | `apps/ops` | International catalog CMS today — **no IE commodity CMS** |
| Contact form + `?product=` | `ContactPage` + marketing contact API | **Partial** — lightest anonymous enquiry with prefill |
| Procurement requests + quotations | `/app/requests`, APIs, `publicCode` | **Possible** only after owner decides IE enquiry ownership |
| GlobalHeader / GlobalFooter | International | **Do not wrap IE** (regression already tested) |

---

## 5. Catalog, media, Ops

### Product model

`Product` / `ProductImage` / `ProductVideo` exist and support published public catalogue + Ops media management.

**There is no `businessId` / line-of-business field** and **no `Commodity` model**.

IE copy currently forbids listing IE offerings in the International product catalogue.

### Media inventory (authoritative)

From `docs/product-media-mapping-report.md` + `docs/catalogue-media-architecture-completion.md`:

| Asset | Status |
|---|---|
| 335 JPEGs | UNMATCHED |
| 7 unique MP4s (`videos/` canonical) | UNMATCHED |
| Imported | **0** |
| Durable production storage | **BLOCKED** until credentials configured |

Spot-check subjects in the WhatsApp dump (laptops, bottles, stoves) are **not** Nigerian agro commodities. **Do not attach this dump to IE commodities.**

Media architecture (upload, ProductVideo, published gate, importer dry-run) can be reused later for **owner-approved IE media**, not for blind import.

### Ops

Ops can manage shared `Product` media. There is **no** Ops module for IE commodities, export resources, or IE-specific announcements. Missing capability should be documented rather than faked.

---

## 6. Procurement / enquiry lifecycle

### Available mechanisms

| Mechanism | Identity | Fit for “Request Export Quote” |
|---|---|---|
| `POST /api/v1/marketing/contact` → `MarketingInquiry` | Marketing inbox | Fast anonymous enquiry; weak structured export fields |
| Authenticated `ProcurementRequest` + quotations / shipments | `publicCode` (e.g. `PR-…`) | Full lifecycle; assumes International procurement org workflow today |
| Dedicated export-quote entity | — | **Does not exist** |

### Backend states (procurement)

Supported progression includes: submitted → needs_clarification → accepted_for_sourcing → sourcing → quote_issued → buyer decision → purchase_in_progress → fulfilled → closed (plus expired/cancelled). Mapping to the buyer-facing export journey (Requirement → … → Completion) is feasible **as a presentation layer** if enquiries are stored as procurement requests — but only if Ops/queues and policy treat IE export as a first-class channel.

### Prefill today

International contact supports `?product=` into the message. IE has **no** commodity slug prefill into an IE-branded quote form.

---

## 7. Content / data reality

| Content type | Current state |
|---|---|
| IE commodity records | **None** |
| Owner-approved ginger/hibiscus/sesame/… list | **Not in repo as enabled data** |
| Specs, packaging, seasonality, markets | **Unknown** — must show “Available on request” / omit until supplied |
| Official IE logo | **Not supplied** (`logoSrc: null`) |
| Countries served / volumes / farmer counts | **Must not invent** |
| Published International catalogue products | **0** real (Phase 6 test beds archived only) |

---

## 8. Proposed information architecture

Base path: `/businesses/almahbub-integrated-export`

| Route | Purpose |
|---|---|
| `/` (portal root) | Agro-export homepage (hero → commodities → trust → quality → process → docs readiness → reach → CTA → footer) |
| `/commodities` | Commodity discovery grid |
| `/commodities/:slug` | Commodity detail (gallery, overview, specs placeholders, quote CTA) |
| `/export-process` | Buyer journey 01–09 mapped to real backend states where connected |
| `/quality` | Sourcing & quality (claims limited to verified copy) |
| `/about` | IE about (separate registration; Group links) |
| `/resources` | Export documentation guidance (variable by commodity/destination — no “every shipment includes all docs”) |
| `/contact` | IE-branded contact |
| `/quote` (or `/contact?intent=quote`) | Request Export Quote form + commodity prefill |

### Proposed navigation

Desktop: Home · Commodities · Export Process · Quality & Sourcing · About · Resources · Contact  
Primary CTA: **Request a Quote**  
Restrained: Part of Almahbub Group  
Pathway: Almahbub International (procurement site)

Footer columns: Commodities · Export · Company · Resources · Contact + Group/International + Privacy/Terms/Cookies + Powered by HaqqTech (footer-only).

### Homepage section map (target)

1. Hero — “Nigerian agricultural commodities, prepared for global markets.”  
2. Commodity discovery  
3. Why buyers work with us (verified claims only)  
4. Sourcing & quality  
5. Export process  
6. Documentation / export readiness  
7. Global reach (regional groupings if markets not configured — **no fabricated country lists**)  
8. Media / operations (one strong video max when approved)  
9. CTA  
10. IE footer  

---

## 9. Proposed data structures (for owner approval)

### Option A — Dedicated `Commodity` domain (recommended)

Separate from International `Product`:

```ts
Commodity {
  id, slug, name, status: draft|published|archived
  originCountry?          // e.g. "Nigeria" when verified
  originRegion?           // optional
  summary?
  overview?
  forms[]                 // e.g. dried, fresh — owner text only
  specifications[]        // { label, value } — omit or "Available on request"
  packaging?
  availabilityNote?       // seasonality only if verified
  qualityNotes?
  exportMarketsNote?      // never invent countries
  images[], videos[]      // reuse CatalogMediaStore pattern
  publishedAt?
}
```

Public API: `GET /api/v1/ie/commodities`, `GET /api/v1/ie/commodities/:slug` (published only).  
Ops: future module — **document as gap** until built; do not invent admin UI.

**Enablement:** owner-approved list with `status=published` only. Suggested candidates (ginger, hibiscus, sesame, cashew, shea, soybean, cocoa, …) remain **disabled** until approved.

### Option B — Reuse `Product` with business scope

Add `lineOfBusiness: international | integrated_export` (or equivalent) and filter public International catalogue to International-only.

**Risks:** pollutes shared Ops mental model; easy to leak IE SKUs onto `/products`; contradicts current content that IE is not in International catalogue.

### Quote / enquiry payload (target fields)

Required (proposed): commodity, quantity, unit, company, email, destination country  
Optional: destination port, Incoterm, packaging, delivery period, phone/WhatsApp, additional requirements  

Storage decision required (see §11).

---

## 10. Media strategy

1. Keep existing ProductImage / ProductVideo / CatalogMediaStore architecture.  
2. Do **not** import `almahbub-product-media` into IE.  
3. When IE commodities exist, use a **separate approved mapping** (filename → commodity slug).  
4. Prefer `videos/` for MP4s; ignore duplicate MP4s under `images/`.  
5. Public media only for **published** commodities.  
6. Missing media → graceful placeholder (“Image coming soon”).  
7. Cards: optional “Video available” flag without downloading video.  

---

## 11. API gaps

| Gap | Impact |
|---|---|
| No IE commodity API | Blocks real catalogue pages |
| No business scoping on `Product` | Cannot safely share International products |
| No IE export-quote endpoint / queue | Blocks structured quote + tracking |
| Marketing contact lacks export fields | Weak for destination/Incoterm/packaging |
| Procurement requests not tagged as IE | Ops cannot separate export vs procurement |
| No Ops IE content types | Cannot CMS-manage commodities without fixtures |
| Durable catalog media in production | BLOCKED until storage credentials configured |

---

## 12. Risks

| Area | Risk | Mitigation |
|---|---|---|
| Responsive | New pages can overflow at 320px | IE layout shell + overflow e2e matrix |
| Accessibility | Drawer focus trap / axe on all new pages | axe on home, commodities, detail, process, quality, about, contact, quote |
| Performance | Lazy routes; don’t pull International catalog CSS into every IE page | Code-split IE module; lazy media below fold |
| SEO | Single URL today | Nested routes + titles/descriptions/canonical/OG when pages ship |
| Footer regression | Historical IE/International footer bugs | Keep `bare` layout; IE footer only; e2e assert no `.hamd-footer` on IE |
| International regression | Accidental merge of chrome or catalogue | Do not wrap IE in `PublicLayout`; do not list IE on `/products` |
| Fake data | Owner pressure to “fill” pages | Empty/“Available on request” patterns; no auto-enable commodities |
| Wrong media dump | WhatsApp merchandise photos | Separate IE media library + mapping |

---

## 13. Testing baseline (when implementation resumes)

- lint / typecheck / unit / build (web + api as touched)  
- Playwright: IE nav, drawer @320, commodities, detail, missing media, quote + prefill, Group/International links, footer  
- axe WCAG A/AA on all IE surfaces (light + dark)  
- Overflow: 320 / 375 / 414 / 768 / 1024 / 1280 / 1440 / 1920  

Do **not** claim production-ready until those gates pass.

---

## 14. Owner decisions required (STOP blockers)

Implementation must not invent answers to these:

1. **Commodity domain:** Option A (`Commodity`) vs Option B (scoped `Product`)?  
2. **Which commodities** may be created as **draft**, and which may be **published**? (List: ginger, hibiscus, sesame, cashew, shea, soybean, cocoa, other.)  
3. **Per-commodity verified fields** (origin detail, forms, specs, packaging, seasonality, markets) — supply or accept “Available on request”.  
4. **Quote storage:** marketing inquiry vs procurement request vs new export-quote entity?  
5. **Tracking UX:** show V2 `publicCode` lifecycle to anonymous IE buyers, or enquiry receipt only until account exists?  
6. **Official brand assets:** logo, photography, any approved video for hero/operations?  
7. **Global reach:** any verified markets/regions, or regional groupings with no country list?  
8. **Ops CMS:** is a future IE commodities module approved, or content stays code/config until then?  
9. **Media:** confirm WhatsApp dump is **out of scope** for IE; provide agro media + mapping when ready.  

---

## 15. Recommended next increment (after approval)

**Not started in this audit sprint.**

Suggested order once decisions land:

1. IE layout shell (header/nav/footer/drawer) with target IA routes as real pages (content-safe stubs where data missing).  
2. Homepage rewrite using approved claims only.  
3. Commodity content module + public API (Option A preferred) with **zero published** until owner enables.  
4. Commodity list/detail UI + media placeholders.  
5. IE quote form + commodity prefill + chosen backend persistence.  
6. Export process / quality / resources pages (copy-led, no fake stats).  
7. Tests + axe + responsive matrix.  

---

## 16. Explicit non-claims

- This audit does **not** implement the multi-page IE portal.  
- No commodities were created or published.  
- No media was imported.  
- International site was not redesigned.  
- Production-ready IE commodity experience is **not** claimed.

---

## STOP

Audit complete. **Await owner approval** on §14 before implementation.
