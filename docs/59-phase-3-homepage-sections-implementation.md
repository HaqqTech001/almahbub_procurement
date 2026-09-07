# Phase 3 - Homepage Sections Implementation

**Package:** `@hamd/ui`  
**Module:** Homepage Sections  
**Status:** Implemented (reusable components)  
**Blueprint:** `docs/47-phase-3-homepage-blueprint.md`

---

## 1. Scope delivered

| Section | Component | Notes |
| --- | --- | --- |
| Trust | `TrustSection` | Indicators + partners + sourced stats |
| Services | `ServicesSection` | Four capability cards + Request CTA |
| Product Categories | `ProductCategoriesSection` | Category discovery cards |
| Featured Products | `FeaturedProductsSection` | MOQ/lead/availability + Request |
| Procurement Workflow | `ProcurementWorkflowSection` | Ordered Request→Deliver steps |
| Industries | `IndustriesSection` | Challenge/outcome cards |
| Testimonials | `TestimonialsSection` | Manual controls; no autoplay |
| FAQ | `FaqSection` | Accordion button/region a11y |
| CTA | `CtaSection` | Inverse band; one primary Request |

Shared: `Section`, `Container`, `ButtonLink`, `homepage-sections.css`, fixtures.

**Import**

```ts
import {
  TrustSection,
  ServicesSection,
  /* … */
} from "@hamd/ui/homepage";
import "@hamd/ui/homepage.css";
```

---

## 2. Design Review

| Gate | Result | Evidence |
| --- | --- | --- |
| One primary CTA per section decision | **PASS** | Request is filled primary; secondary is outline/ghost |
| No placeholder layouts | **PASS** | Typed props + production fixtures; no lorem blocks |
| Trust = evidence | **PASS** | Stats require `source`; partners require relationship text |
| No cart/stock language | **PASS** | “Available to source”; Request this product |
| Motion calm + reduced-motion | **PASS** | ≤180ms fade-up; disabled under `prefers-reduced-motion` |
| Testimonials no autoplay | **PASS** | Explicit Previous/Next only |
| Hierarchy / squint | **PASS** | Eyebrow → H2 → body → actions; CTA band inverse |
| Responsive | **PASS** | 1→2→3/4 column grids; FAQ/testimonial narrow measure |
| Brand | **PASS** | Navy inverse CTA; action blue; no gold spam |

**Design verdict:** GO for composition into the public Homepage page once Hero/Nav/Footer shells land.

---

## 3. Engineering Review

| Area | Result | Notes |
| --- | --- | --- |
| Package boundary | **PASS** | `@hamd/ui` workspace package; peer React |
| Tree-shaking / splitting | **PASS** | `./homepage` export path; CSS side-effect isolated |
| Accessibility | **PASS** | Landmarks, labelled sections, FAQ accordion pattern, ≥44px targets, focus-visible |
| SEO readiness | **PASS** | Semantic headings/lists; FAQ answers in DOM (not JS-only); consumers add FAQPage JSON-LD |
| Performance | **PASS** | Lazy images + `decoding=async`; reserved aspect ratios; no chart/Lottie deps |
| Dark mode | **PASS** | `[data-theme="dark"]` token remap |
| Tests | **PASS** | Vitest + Testing Library coverage for all nine sections |
| Security | **N/A / OK** | Presentational; hrefs provided by app; no `dangerouslySetInnerHTML` |
| Maintainability | **PASS** | Data via props; fixtures separated; cx utility |

**Engineering verdict:** GO to depend from a future `apps/web` public app. Wire real CMS/API data at page level - do not hardcode fixtures in production routes.

---

## 4. KEEP / REFACTOR / REPLACE (legacy HomePage)

| Decision | Item | Explanation |
| --- | --- | --- |
| KEEP | Intent of trust, services, FAQ, contact CTA | Users expect these beats |
| REFACTOR | Collage marketing sections → structured section components | Premium hierarchy + a11y |
| REPLACE | Ecommerce cues and unverified counters | Identity charter + trust blueprint |
| REPLACE | In-page one-off HomePage markup | Reusable `@hamd/ui` sections |

---

## 5. Commands

```bash
pnpm --filter @hamd/ui test
pnpm --filter @hamd/ui build
pnpm --filter @hamd/ui typecheck
```

---

## STOP

Homepage sections implemented with tests and reviews. Page shell composition is a separate module.
