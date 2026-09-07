# Phase 3 - Homepage Performance Optimization

**Module:** Homepage Performance  
**Package:** `@hamd/ui`  
**Targets:** Lighthouse Performance &gt; 95 · Accessibility 100 · Best Practices 100 · SEO 100

---

## 1. Optimization report (implemented)

| Area | Before | After |
| --- | --- | --- |
| **Images** | Optional photo LCP; mixed lazy | Default **layered SVG** (no raster LCP). `OptimizedImage` lazy + `fetchpriority`, sizes defaults, CLS-safe. Hybrid photo stays `loading="lazy"`. |
| **Fonts** | `Inter` in CSS (webfont risk / FOIT) | **System stack** (`Segoe UI`, `system-ui`, …). Optional `@font-face` with `font-display: swap` only if host self-hosts. |
| **Bundles / JS** | Below-fold lazy, but could mount ASAP | **`DeferredBelowFold`**: idle **prefetch** + **IntersectionObserver** gate. Hero `animateCounters` **off** by default (less TBT). |
| **CSS** | Monolithic homepage CSS | Added **`homepage-critical.css`** export for inline/critical path; `content-visibility` on below-fold. |
| **Code splitting** | `HomepageBelowFold` async chunk | Preserved; Homepage no longer statically imports below-fold. |
| **Lazy loading** | Images + Suspense | Images + deferred section mount + Suspense fallback. |
| **Caching** | Host-only | Documented `homepageCacheRecommendations` (HTML SWR, immutable assets). |
| **Prefetching** | None | Idle chunk prefetch; route `prefetch` hints via `getHomepageHeadHints`. |
| **Preloading** | Ad hoc | `getHomepageHeadHints` → preload LCP image (if any), fonts, preconnect CDN. |
| **SEO** | Organization JSON-LD | + **FAQPage** JSON-LD, title/description/meta helpers, canonical/og fields. |

### Lighthouse score posture (component package)

| Category | Expected when hosted correctly | Notes |
| --- | --- | --- |
| Performance | **&gt; 95** | SVG hero, deferred JS, system fonts, content-visibility |
| Accessibility | **100** | Existing AA landmarks/focus; reduced-motion kill-switch in critical CSS |
| Best Practices | **100** | No blocking webfonts; passive scroll already; HTTPS/host CSP still required |
| SEO | **100** | Title/description helpers, crawlable copy, Org + FAQ JSON-LD |

*Scores are host-dependent (SSR/SSG, compression, CDN, HTTP/2). This package removes the usual homepage score killers.*

---

## 2. How to use

```tsx
import {
  Homepage,
  getHomepageHeadHints,
  homepageCacheRecommendations,
} from "@hamd/ui/homepage";
import "@hamd/ui/homepage-critical.css"; // optional early
import "@hamd/ui/homepage.css";

const head = getHomepageHeadHints({
  canonicalUrl: "https://almahbub.com/",
  preconnect: ["https://cdn.almahbub.com"],
  // only if visualMode=image|hybrid:
  // heroImageSrc: "/media/hero.avif",
  // heroImageType: "image/avif",
});

// Map `head` into Next.js Metadata / document <head>
<Homepage seo={{ ...head, includeFaqJsonLd: true }} />
```

CDN: apply `homepageCacheRecommendations`.

---

## 3. Recommendations (host / ops)

1. **SSR/SSG** the Header + Hero + Trust HTML; stream or hydrate below-fold.  
2. **Inline** `homepage-critical.css` (&lt;2KB gzip goal) in `<head>`.  
3. **Do not** load Google Fonts on the Homepage critical path.  
4. Keep default **`visualMode="layered"`**; if photo campaigns, ship AVIF/WebP &lt;100KB and preload only that URL.  
5. Enable **Brotli/Gzip**, HTTP/2+, and immutable hashed assets.  
6. Set **CSP**, HTTPS redirect, and no mixed content (Best Practices 100).  
7. Prefetch **`/request`** after `load` or on CTA hover (hints already generated).  
8. Measure with Lighthouse CI on the real `apps/web` once scaffolded - adjust `rootMargin` if needed.  
9. Avoid third-party tags on first paint (analytics: consent + deferred).  
10. Provide real `width`/`height` (or aspect-ratio) on all CMS images.

---

## 4. Files added/updated

| File | Role |
| --- | --- |
| `HomepagePerformance.tsx` | Head hints, FAQ JSON-LD, deferred loader, cache constants |
| `homepage-critical.css` | System fonts, content-visibility, reduced-motion |
| `Homepage.tsx` | Wired deferred load, FAQ LD, counters off |
| `OptimizedImage.tsx` | sizes + fetchpriority defaults |
| `docs/67-…` | This report |

---

## 5. Verification

```bash
pnpm --filter @hamd/ui test
pnpm --filter @hamd/ui build
```

---

## STOP

Homepage performance optimizations and report delivered.
