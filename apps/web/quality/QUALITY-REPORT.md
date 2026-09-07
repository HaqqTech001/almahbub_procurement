# Homepage production quality report - Phase A

**URL tested:** http://127.0.0.1:4173/ (vite preview of production build)  
**Date:** 2026-08-06  
**Form factor (Lighthouse):** desktop 1440×900

## 1–3. Screenshots

| Viewport | Above-fold | Full page |
| --- | --- | --- |
| Desktop 1440×900 | `screenshots/homepage-desktop-above-fold.png` | `screenshots/homepage-desktop-full.png` |
| Tablet 768×1024 | `screenshots/homepage-tablet-above-fold.png` | `screenshots/homepage-tablet-full.png` |
| Mobile 390×844 | `screenshots/homepage-mobile-above-fold.png` | `screenshots/homepage-mobile-full.png` |

## 4. Lighthouse scores (desktop)

| Category | Score |
| --- | --- |
| Performance | **69** |
| Accessibility | **94** |
| Best Practices | **100** |
| SEO | **92** |

Artifacts: `reports/lighthouse-summary.json`, `reports/lighthouse-desktop.html`, `reports/lighthouse-desktop.json`.

## 5. Accessibility report (axe-core)

| Metric | Result |
| --- | --- |
| Violation rules | **0** |
| Passes | 33 |
| Incomplete | 2 |

Artifacts: `reports/accessibility-summary.json`, `reports/accessibility-axe.json`.

WCAG tags run: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

## 6. Remaining issues

1. **Performance (69)** - Lab score on local preview; below-fold is eager for completeness; further gains need image compression strategy, stricter code-splitting, and CDN hosting. Target ≥90 on production CDN.
2. **Lighthouse Accessibility 94 vs axe 0 violations** - LH still flags items axe did not (likely contrast on decorative/hero SVG or landmark scoring). Review `lighthouse-desktop.html` audits before Auth work.
3. **SEO 92** - Confirm crawlable `robots` / meta completeness on hosted domain; FAQ JSON-LD is present.
4. **Newsletter** - Waitlist via `localStorage` (+ optional API) until `POST /api/v1/marketing/newsletter` exists. Success copy is honest; not an inbox confirmation.
5. **Soft routes** - Homepage CTAs land on “migrating to Version 2” pages (`ComingSoonPage`), not full destination UX.
6. **Campaign preview** - Keep `VITE_PREVIEW_CAMPAIGNS=false` in production; wedding window is date-gated.
7. **Photographic hero** - Layered SVG is production-grade; documentary photo LCP still optional when brand assets are approved.
8. **Auth / catalog / request** - Explicitly out of scope for this STOP; do not start Authentication until Homepage is signed off.

## Re-run

```bash
corepack pnpm --filter @hamd/web build
corepack pnpm --filter @hamd/web exec vite preview --host 127.0.0.1 --port 4173
corepack pnpm --filter @hamd/web quality:homepage
corepack pnpm --filter @hamd/web quality:lighthouse
```

**STOP - do not proceed to Authentication.**
