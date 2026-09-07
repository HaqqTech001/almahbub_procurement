# RC-POLISH-04 - Hero card overlap + account panel overlay

**Status:** Complete - STOP before next feature/parity work.  
**Date:** 2026-08-09

## 1. Root cause - hero card overlap

The layered hero used a **full-bleed absolute visual plane** (`position: absolute; inset: 0`) behind copy that had `z-index: 1`.

Decorative Trade / Shipment / Supplier cards were **absolutely positioned** inside that plane. The Product Search card lived in the copy column.

On tablet/narrow widths the copy column widened into the same viewport region as the floating cards. Because copy paints above the plane, **Product Search visually covered** the decorative cards. Tablet rules also parked remaining absolute cards in the same corner, causing mutual overlap.

This was a layout/stacking composition bug - not a z-index “paint over” fix.

## 2. Root cause - account panel staying open

`.hamd-header__account-menu { display: grid; }` **overrode the HTML `hidden` attribute**, so the account dropdown stayed painted even when React set `hidden`.

That left a permanent panel (and interaction surface) over the homepage.

## 3. Components / files changed

| Area | Files |
|------|--------|
| Hero structure | `packages/ui/src/homepage/HomepageHero.tsx` |
| Hero layout CSS | `packages/ui/src/styles/homepage-sections.css` |
| Visual cards CSS | `packages/ui/src/styles/hero-visual-system.css` |
| Account menu | `packages/ui/src/navigation/GlobalHeader.tsx`, `global-header.css` |
| Tests | `HeroVisualSystem.test.tsx`, `GlobalHeader.test.tsx` |
| E2E + harness | `apps/web/e2e/rc-polish-04-hero.spec.ts`, `PublicHeaderAuthPreviewPage.tsx`, `App.tsx` |

## 4. Responsive strategy

- **Desktop (≥960 / ≥1024):** split grid - copy | visual stage. Cards keep layered absolute composition **inside the stage only**.
- **Tablet (768–1023):** stage in document flow; cards reflow to a **3-column CSS grid** (no absolute stacking).
- **Mobile (<768):** copy first, then stage; cards **stack in one column**. All three remain visible.

Search never shares a stacking context with the decorative cards.

## 5. Mobile navigation behavior

≤959px header: **Menu | Logo | Bell | Avatar**. Search / theme / language / CTA / auth links live in the drawer. Avatar opens the **drawer** (not a desktop dropdown).

## 6. Evidence

`apps/web/e2e/evidence/rc-polish-04/`

- `homepage-closed-{390,430,768,1024,1280,1920}.png`
- `homepage-account-open-1280.png` / `homepage-account-closed-1280.png`
- `homepage-account-mobile-390.png`

## 7–9. Quality gates

- UI unit tests (hero + header): pass  
- Playwright RC-POLISH-04: 8 passed  
- `@hamd/web` typecheck + build: pass  

## 10. Remaining visual notes

- Desktop card float animations remain (stage-scoped only).  
- Authenticated users browsing public pages still use public chrome (stripped CTA/language) - workspace shell remains on `/app`.  
- Do **not** start the next parity feature until this sprint is accepted.
