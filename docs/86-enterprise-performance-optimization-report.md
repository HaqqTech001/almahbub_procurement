# HAMD Genesis - Enterprise Performance Optimization Report

**Review date:** 2026-08-05  
**Targets:** Lighthouse Performance **>95** · Accessibility **100** · Best Practices **100** · SEO **100**  
**Scope:** Images · Bundles · Fonts · Caching · Lazy loading · Code splitting · Memory usage  
**Package surface:** `@hamd/ui`, `@hamd/ui/performance`, `@hamd/api` OpenAPI cache headers

---

## Verdict

Genesis UI/API now ship the structural optimizations required for those Lighthouse targets on a correctly hosted public surface (SSR/SSG header+hero, CDN compression, HTTPS, hashed assets). Scores remain **host-dependent**; this report documents what the monorepo guarantees and what hosts must still apply.

| Category | Posture when hosted correctly |
| --- | --- |
| Performance | **>95** - system fonts, SVG/default hero, deferred JS, content-visibility, no Framer on auth critical path, true dashboard widget code-split |
| Accessibility | **100** - existing AA contracts; decorative images keep empty alt when parent is `aria-hidden`; reduced-motion CSS |
| Best Practices | **100** - no blocking third-party fonts, `referrer` / `theme-color` / `color-scheme` hints, HTTPS/CSP still host-owned |
| SEO | **100** - title/description/canonical/OG/Twitter/FAQ JSON-LD helpers |

---

## Optimizations implemented

### Images
- Strengthened `OptimizedImage`: lazy by default, `fetchPriority`, sizes defaults, **aspect-ratio from width/height** (CLS).
- Wired catalog `ProductCard`, recommendation cards, and dashboard recently-viewed thumbnails through `OptimizedImage`.
- Added `buildSrcSet` / `preferModernImageFormats` helpers (AVIF → WebP → JPEG) for CDN hosts.
- Homepage still defaults to **layered SVG hero** (no raster LCP); photo modes preload only when configured.

### Bundles
- **Removed `framer-motion`** from `@hamd/ui` dependencies. Auth entrance is CSS (`hamd-auth-motion`) - major auth TBT/size win.
- Published `lighthouseBundleBudgets` soft caps for host CI (homepage initial ≤170KB gzip, etc.).
- Documented host rule: do not put charts/maps/editors on the first public chunk.

### Fonts
- Critical path remains **system stack** + optional `@font-face` with `font-display: swap`.
- `fontLoadingPolicy` forbids third-party webfonts on the homepage critical path.
- Font files only via `preconnect`/`preload` when self-hosted.

### Caching
- Expanded `homepageCacheRecommendations` (+ hashed CSS/JS).
- Platform-wide `platformCacheRecommendations` (HTML SWR, immutable assets, fonts, images, OpenAPI).
- API `/openapi.json` and `/docs` now send `Cache-Control: public, max-age=300, stale-while-revalidate=3600`.
- Authenticated API remains `private, no-store` by policy.

### Lazy loading
- Homepage `DeferredBelowFold` (idle prefetch + IntersectionObserver) retained.
- New generic `DeferredMount` + `useIdleCallback` with unmount cancel (memory-safe).
- Images lazy unless `priority`.

### Code splitting
- **Real split** of client dashboard widgets: overview stays in `DashboardWidgets.tsx`; RFQs→recommendations load from `DashboardWidgetsDeferred.tsx` via `React.lazy`.
- `dashboardLazy` exposes deferred widgets + charts entry points for host routers.
- Auth screens already expose `authLazyScreens`.

### Memory usage
- Deferred observers disconnect after first intersection.
- Idle callbacks cancel on unmount.
- Auth motion no longer retains Framer animation trees / `will-change` permanently.
- `content-visibility` utilities in `enterprise-performance.css` and homepage-critical CSS.

### SEO / Best Practices head hints
- Homepage + `getPublicPageHeadHints`: `theme-color`, `color-scheme`, `format-detection`, `referrer`, OG locale, Twitter, canonical.

---

## How hosts hit the score targets

```tsx
import {
  Homepage,
  getHomepageHeadHints,
  homepageCacheRecommendations,
  platformCacheRecommendations,
  lighthouseBundleBudgets,
} from "@hamd/ui";
import "@hamd/ui/homepage-critical.css"; // inline <2KB gzip in <head>
import "@hamd/ui/performance.css";
import "@hamd/ui/homepage.css";

const head = getHomepageHeadHints({
  canonicalUrl: "https://almahbub.com/",
  preconnect: ["https://cdn.almahbub.com"],
});
// Map into Next Metadata / document <head>
```

1. **SSR/SSG** Header + Hero + Trust; stream/hydrate below-fold.  
2. Apply CDN headers from `platformCacheRecommendations`.  
3. Brotli/Gzip, HTTP/2+, hashed immutable JS/CSS.  
4. No Google Fonts / third-party tags before consent on first paint.  
5. Measure with Lighthouse CI against `lighthouseBundleBudgets`.  
6. CSP + HTTPS redirects (Best Practices).

---

## Verification

```bash
pnpm --filter @hamd/ui test
pnpm --filter @hamd/ui typecheck
pnpm --filter @hamd/ui build
pnpm --filter @hamd/api test
```

Suites added/updated: `performance/performance.test.tsx`, homepage head hints, dashboard lazy path, auth without Framer.

---

## Remaining host-owned debt (documented)

1. **Lighthouse CI on a real `apps/web` host** - not scaffolded in this monorepo; component package cannot emit a numeric LH score alone.  
2. **CDN image transforms** - helpers emit AVIF/WebP query patterns; CDN must implement them.  
3. **Distributed HTTP cache / edge** - API OpenAPI short cache is in-process headers only.  
4. **Legacy trees** (`backend/`, `client-frontend/`) are outside Genesis performance gates.

---

## STOP

Enterprise performance optimizations and optimization report delivered.
