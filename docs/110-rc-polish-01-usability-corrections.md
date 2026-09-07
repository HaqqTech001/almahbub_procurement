# RC-POLISH-01 - Production Usability Corrections

**Status:** Implemented (migration paused)  
**Date:** 2026-08-07  
**Scope:** Public web chrome, auth redirect, product cards/images, theme, product tour

## Defects fixed

| # | Area | Defect | Fix |
| --- | --- | --- | --- |
| 1 | Authz | Anonymous `/app` → **Unauthorized** | `RequireAuth` redirects to `/login?returnTo=…` |
| 2 | Authz | Login ignored return path | `LoginPage` honors `returnTo` / location state |
| 3 | Navbar | Text-only brand, overflow, weak mobile | Logo SVG, active states, tighter mobile bar, improved drawer |
| 4 | Auth chrome | Missing Sign In / Sign Up / session actions | Guest: Sign In + Sign Up; Auth: Dashboard, Profile, Notifications, Avatar, red Sign Out (+ confirm) |
| 5 | Logo | Temporary/text brand | Official V1 `almahbub.svg` (+ png) in `apps/web/public` |
| 6 | Theme | Text “Theme” button | Animated sun/moon switch (`role="switch"`) |
| 7 | Tour | Premature global disable | “Don’t show again” suppresses **tour key only** (no global `neverAutoStart`) |
| 8 | Tour | Overflow / bad position | Viewport-space measurement; collision-aware `calloutStyle`; scroll-into-view |
| 9 | Tour | Hidden mobile targets | Targets retargeted to always-visible anchors |
| 10 | Images | Broken/blank cards | `resolveMediaUrl`, API empty-image fallback to content, `OptimizedImage` placeholder on error |
| 11 | Cards | Non-enterprise layout | Consistent height, shadow, badges, price row, hover/focus |
| 12 | Responsive | Header overflow risk | Brand truncation, overflow-x clip, denser <480px actions |

## Remaining UI defects / follow-ups

- Full visual responsive audit screenshots at every listed breakpoint (manual / Playwright capture still needed in CI).
- Ops app header/theme not in this pass.
- Live marketing featured API still weak; content fallback covers images when API omits them.
- Language selector still English-only (FR disabled).
- Global design review of every authenticated workspace screen is incomplete (focus was public chrome + catalog cards).
- Accessibility axe CI sweep not fully automated in this change set.

## Regression risks

- Header auth menu + theme switch CSS may need visual QA on transparent hero.
- Tour `calloutStyle` now prefers `position: fixed` - verify non-home tours.
- `RequireAuth` → login changes bookmarkable `/unauthorized` flows for anonymous users (intentional).
- Product card markup/CSS changes may affect homepage grid spacing tests/snapshots.

## Quality gates (run locally)

- `@hamd/ui` GlobalHeader + guidance tests: green after fixes
- Typecheck / lint / build / Playwright: execute in CI or local follow-up

## Screenshots

Capture before/after manually at 320 / 375 / 768 / 1280 for:

1. Homepage header (guest)
2. Homepage header (authenticated)
3. Product card grid
4. Product tour step 1–3
5. Theme toggle light/dark
