# RC-POLISH-02 - Almahbub International UI/UX Recovery

**Status:** Core system fixes landed; browser e2e green for responsive chrome  
**Date:** 2026-08-09  
**Migration:** STOPPED until this sprint is accepted - do not start the next parity row

## Root causes discovered

1. **TourOn** - `GuideControl` concatenated label + status; public routes lacked `guidance.css`.
2. **False overflow masking** - `html/body { overflow-x: clip/hidden }` hid component overflow.
3. **Stale CSS pipeline** - `@hamd/ui/*.css` resolved to outdated `dist/styles` while Vite ignored dist HMR; mobile navbar rules never reached the browser until exports pointed at `src/styles`.
4. **Drawer scrollWidth** - closed drawer used `translateX(100%)`, expanding document width to ~2× viewport (e.g. 640 at 320). Fixed by collapsing closed drawer width to `0`.
5. **Navbar overcrowding** - desktop utilities remained visible under 960px because stale CSS hid nothing.
6. **False Unauthorized (web)** - anonymous `/app` → login (POLISH-01); ops still sent anonymous → Unauthorized (fixed here).
7. **Silent empty permissions** - `/me` failure after login left `authenticated` + `permissions=[]`.
8. **Featured images 404** - `GET /api/v1/marketing/catalog/featured` missing; content fallback worked; API route added.
9. **Brand / location** - customer UI still said HAMD Genesis; footer defaulted Lagos (now Ilorin).
10. **Tour auto-disable** - `in_progress` progress blocked auto-offer; now resumes.

## Fixes implemented

| Area | Change |
| --- | --- |
| Branding | Almahbub International customer-facing; footer “Powered by HaqqTech”; V1 logo lockup on auth + header |
| CSS pipeline | Package CSS exports → `src/styles/*` so Vite picks live design-system CSS |
| Navbar | Desktop grid; ≤959px logo + menu only; drawer holds search/theme/lang/auth/CTA |
| Overflow | Removed body clip hacks; closed drawer width 0; hero scale without lateral translate |
| Tour | Icon control; resume in-progress; viewport-aware callout; no “TourOn” |
| Authz | Web RequireAuth regression tests; ops anonymous → `/login?returnTo`; `/me` failure → session expired |
| Images | Featured marketing API + content fallback; branded ProductCard placeholder on error |
| Location / wedding | Ilorin HQ; September 2026 wedding campaign + balloon confetti |
| Nav IA | Public links: Home, About, Services, Products, Industries, Contact (no mega dropdown clutter) |
| Cards / tokens | Shared container + card structure in foundation; catalog card body flex |

## Responsive verification (Playwright)

`apps/web/e2e/responsive-chrome.spec.ts` against `http://127.0.0.1:3000`:

- **chromium-desktop:** 14/14 passed (overflow 320–1920, mobile drawer, login redirect, product images, footer)
- **chromium-mobile:** run after desktop (same suite)

Manual screenshot matrix at every listed width remains recommended for visual QA sign-off.

## Quality gates (this session)

| Check | Result |
| --- | --- |
| `@hamd/ui` typecheck | Pass |
| `@hamd/web` typecheck | Pass |
| `@hamd/api` typecheck | Pass |
| `@hamd/ops` typecheck | Pass |
| Lint ui/web/api/ops | Pass (after unused-var / type-import fixes) |
| UI unit (guidance/auth/header/catalog) | Pass |
| Web RequireAuth + homepage-products | Pass |
| Featured API `GET /api/v1/marketing/catalog/featured` | 200 |
| Playwright responsive chrome (desktop) | 14/14 |

Root `turbo typecheck` failed in this environment (`cannot find binary path`) - package filters succeeded.

## Remaining defects / follow-ups

- Full authenticated client journey Playwright (login → dashboard → requests → …) still thin beyond RequireAuth unit tests.
- Ops buyer `ops:access` in `DEFAULT_BUYER_PERMISSIONS` over-privilege (security hygiene; separate from Unauthorized page).
- Content density polish for sparse public pages can continue after visual QA screenshots.
- Capture permanent screenshot artifacts for the acceptance checklist widths if required for release notes.

## STOP

Do **not** start the next V1 parity matrix row until product accepts this sprint.
