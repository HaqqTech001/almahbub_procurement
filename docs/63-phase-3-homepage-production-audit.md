# Phase 3 - Homepage Production Audit

**Mission:** Complete Homepage using approved design system and UX blueprints.  
**Rule:** Do not redesign. Do not simplify. Production-ready composition.

---

## Classification legend

| Class | Meaning |
| --- | --- |
| **KEEP** | Ship as-is into the Homepage composer |
| **REFACTOR** | Preserve contract; tighten for page composition / reuse |
| **REPLACE** | Do not use in Phase 3 public Homepage |

---

## 1. Shell & chrome

| Item | Decision | Explanation |
| --- | --- | --- |
| `GlobalHeader` (`@hamd/ui/navigation`) | **KEEP** | Approved Phase 3 nav (docs/53, docs/61). Sticky, mega menus, Request CTA, a11y. |
| `HomepageHero` Concept E | **KEEP** | Approved Accountable Corridor (docs/48, docs/60). Single H1, LCP plane, Request primary. |
| `GlobalFooter` | **KEEP** | Approved footer (docs/56, docs/62). Basebar HAQQ TECH; Request remains text link. |
| Mid-page newsletter inside footer only | **REFACTOR** | Footer newsletter stays; add dedicated mid-page `NewsletterSection` per required IA. Extract shared `NewsletterCapture` to avoid duplicated UI. |
| Legacy `client-frontend` HomePage / Navbar / Footer | **REPLACE** | docs/57 - not the Phase 3 public shell; marketing collage posture. |
| Empty `layouts` export | **REFACTOR** | Add `PublicWebsiteShell` (header + main + footer) for reuse. |

---

## 2. Existing mid-page sections

| Item | Decision | Explanation |
| --- | --- | --- |
| `TrustSection` indicators | **KEEP** | Matches Trust Indicators requirement. |
| Partners + stats nested in `TrustSection` | **REFACTOR** | API remains optional for compatibility. Homepage uses dedicated Supplier Network + Platform Statistics so each section has one job (docs/51). |
| `ServicesSection` | **KEEP** | Core Procurement Services. |
| `IndustriesSection` | **KEEP** | Industries Served. |
| `FeaturedProductsSection` | **KEEP** | Featured Products + product card system. |
| `ProductCategoriesSection` | **KEEP** | Product Categories. |
| `ProcurementWorkflowSection` | **KEEP** | Procurement Process Timeline. |
| `TestimonialsSection` | **KEEP** | Manual carousel; no autoplay. |
| `FaqSection` | **KEEP** | FAQ accordion a11y pattern. |
| `CtaSection` | **KEEP** | Final Request band. |
| `Section` / `Container` / `ButtonLink` | **KEEP** | Shared primitives - no duplicated shells. |
| `homepageFixtures` | **REFACTOR** | Expand for new sections; still demo-only - host apps supply CMS/API data. |

---

## 3. Gaps vs required 16 sections

| # | Required | Decision | Explanation |
| --- | --- | --- | --- |
| 1 | Global Header | **KEEP** | Compose at page shell. |
| 2 | Premium Hero | **KEEP** | Eager-load (LCP). |
| 3 | Trust Indicators | **KEEP** | `TrustSection` indicators-only on Homepage. |
| 4 | Company Overview | **REPLACE gap → NEW** | Build `CompanyOverviewSection` - no redesign of visual system; uses `Section` + editorial copy/media. |
| 5 | Core Procurement Services | **KEEP** | |
| 6 | Industries Served | **KEEP** | |
| 7 | Featured Products | **KEEP** | |
| 8 | Product Categories | **KEEP** | |
| 9 | Global Supplier Network | **REPLACE gap → NEW** | Build `SupplierNetworkSection` (partners elevated from trust sub-block). |
| 10 | Procurement Process Timeline | **KEEP** | |
| 11 | Platform Statistics | **REPLACE gap → NEW** | Build `PlatformStatisticsSection` - static sourced metrics (docs/47: no count-up). |
| 12 | Testimonials | **KEEP** | |
| 13 | FAQ | **KEEP** | |
| 14 | Newsletter | **REPLACE gap → NEW** | Mid-page `NewsletterSection` + shared capture control. |
| 15 | Call To Action | **KEEP** | |
| 16 | Premium Footer | **KEEP** | |

---

## 4. Page assembly

| Item | Decision | Explanation |
| --- | --- | --- |
| Homepage composer | **NEW** | `Homepage` wires all 16 in the mission order. |
| Code splitting | **NEW** | Eager: Header, Hero. Lazy: below-fold sections via `React.lazy` + `Suspense`. |
| Image optimization | **REFACTOR** | Shared `OptimizedImage` (lazy, async decode, sizes, dimensions). |
| SEO helpers | **NEW** | Page title/meta props + Organization/WebSite/FAQ JSON-LD helpers. |
| `apps/web` route | **DEFER** | No host app yet; ship production composer in `@hamd/ui` for drop-in. |

---

## 5. Non-negotiables carried forward

- One H1 (hero only)
- Request Procurement is the primary conversion language - no checkout/cart
- Verified trust only; sourced statistics
- WCAG AA, dark mode, `prefers-reduced-motion`
- Do not invent offices, partners, or metrics

---

## STOP (audit)

Audit complete. Implementation proceeds from KEEP / REFACTOR / REPLACE above.
