# RC-POLISH-03 - Authenticated navigation + workspace shell

**Status:** Complete - STOP before next parity feature.  
**Date:** 2026-08-09

## Root causes fixed

1. **Same chrome for guest and signed-in users** - authenticated `/app` used marketing header patterns / avatar mega-nav instead of an application shell.
2. **Workspace IA inside avatar menu** - Dashboard / module links lived in a floating account dropdown.
3. **Public CTAs on authenticated chrome** - Request Procurement + language selector remained in signed-in utility rows (or left empty gaps when hidden).
4. **Post-login bounce to `/`** - `returnTo=/` (or homepage defaults) sent users back to the marketing site instead of `/app`.
5. **Tour / celebration as layout debt** - TourOn-style controls and a thin announcement strip did not meet workspace-quality IA.

## What shipped

### Public (logged-out)

- Almahbub International logo + Home / Services / Catalog / Industries / About / Contact
- Search, theme, language, Sign In / Sign Up, Request Procurement CTA
- Mobile drawer (not workspace shell)

### Authenticated client workspace

- `ClientWorkspaceShell`: desktop sidebar (sectioned nav, collapse + tooltips, danger Sign Out) + utility top bar (page title, search, theme, Help/Guided tour, notifications, compact account menu)
- Mobile: menu → navigation drawer (Escape, focus, body scroll lock, width 0 when closed)
- Account menu: Profile / Account settings / Help·tour / Sign Out (danger) - **no** module dump
- Logo → `/app`; login `safeReturnTo` maps `/` → `/app` and preserves protected `returnTo`
- Wedding campaign: September celebration, Celebrate with us + Dismiss, restore “Show again”, subtle balloons/confetti
- Only implemented routes linked (no Orders / Invoices / Payments until they exist)

## Evidence

Playwright suite: `apps/web/e2e/rc-polish-03-workspace.spec.ts`  
Screenshots: `apps/web/e2e/evidence/rc-polish-03/`

| File | Capture |
|------|---------|
| `public-{390,768,1280,1920}.png` | Public navbar |
| `public-mobile-drawer-390.png` | Public mobile menu |
| `workspace-{390,768,1280,1920}.png` | Authenticated shell |
| `workspace-mobile-drawer-390.png` | Workspace drawer |
| `account-menu-1280.png` | Compact account menu |
| `wedding-celebration-1280.png` | September celebration |
| `product-tour-1280.png` | Help / Guided tour control |
| `dashboard-1280.png` | Dashboard |
| `requests-1280.png` | Requests context in shell |

Harness route (DEV or `VITE_E2E_SHELL_PREVIEW=true`): `/__e2e__/workspace-shell` - not linked from product chrome.

## Quality gates

- `@hamd/ui` focused tests: GlobalHeader + ClientWorkspaceShell - pass
- `@hamd/web` typecheck - pass
- `@hamd/web` build - pass
- RC-POLISH-03 Playwright evidence - 6 passed (project-gated skips)

## Remaining issues / follow-ups (out of sprint)

- Live authenticated `/app/requests` data screenshots require a verified buyer session (harness covers shell IA).
- Feature Discovery tip can still surface on first workspace visit; dismissible, not layout whitespace.
- Orders / Invoices / Payments nav items intentionally omitted until routes exist.
- Do **not** proceed to the next V1 parity matrix row until this sprint is accepted.
