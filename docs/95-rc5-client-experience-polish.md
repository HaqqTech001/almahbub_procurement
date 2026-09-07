# RC5 - Client Experience Consistency Polish

**Status:** COMPLETE  
**Date:** 2026-08-06  
**Host:** `apps/web` (there is no `apps/client`; `/app` is the buyer workspace)

## Scope

Polish only - no new product features. Unified host chrome so every page reads as one enterprise platform.

## Improvements

| Area | Change |
| --- | --- |
| Consistency | Shared `HostPage` / `HostAlert` / `HostStatus` / `HostLoading` / `HostBackLink` |
| Spacing | Common `.hamd-web-host` gap across quotations, notifications, shipments, procurement |
| Typography | Existing serif display + Source Sans body retained; status/alert type scale aligned |
| Animations | Subtle workspace main enter; respects `data-reduced-motion` |
| Loading / skeletons | Quotation compare + history use `HostLoading`; list modules keep package skeletons |
| Empty states | Settings session/device empties use `.hamd-web-empty` |
| Error / success | One alert + status system (dark-mode aware CSS variables) |
| Accessibility | Focus-visible rings on buttons/chips/inputs/toast/modal close; high-contrast dataset |
| Performance | No new eager bundles; polish is CSS + thin presentational wrappers |
| Dark mode | Expanded foundation + auth-host tokens; dashboard OS dark no longer overrides explicit light |
| Responsive / touch | Buttons/chips ≥ 2.5–2.75rem; mobile workspace CTAs full-width |
| Keyboard / focus | Focus-visible utilities; shell skip link unchanged |
| Workspace chrome | Dynamic page title, `aria-current` nav, Alerts → `/app/notifications`, removed duplicate Security nav |

## Files of note

- `apps/web/src/components/HostChrome.tsx`
- `apps/web/src/styles/web.css`
- `apps/web/src/styles/foundation.css`
- `apps/web/src/styles/auth-host.css`
- `apps/web/src/auth/onboarding/WorkspaceShell.tsx`
- `packages/ui/src/styles/dashboard.css` (theme preference respect)

## Quality

Run lint / typecheck / test / build for `@hamd/ui` and `@hamd/web`.
