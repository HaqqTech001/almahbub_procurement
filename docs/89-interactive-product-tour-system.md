# Interactive Product Tour System (RC4.4)

**Document:** `docs/89-interactive-product-tour-system.md`  
**Project:** Almahbub International V2 · HAMD Genesis  
**Phase:** RC4.4  
**Status:** Implemented

---

## Purpose

Platform-wide Interactive Product Tour is a **core product feature**, not a third-party add-on. It extends the enterprise guidance engine (`@hamd/ui/guidance`, see `docs/88-enterprise-guidance-onboarding-learning.md`) with role-aware catalogs, versioned persistence, full runner controls, and V2 host adapters in `apps/web`.

---

## Architecture

| Layer | Location |
| --- | --- |
| Engine | `packages/ui/src/guidance` - provider, TourRunner, Spotlight, Learning Center, admin workspace |
| Role + catalog contracts | `packages/ui/src/guidance/product-tour.ts` |
| Styles | `@hamd/ui/guidance.css` |
| Web host | `apps/web/src/product-tour/ProductTourHost.tsx` |
| Authenticated shell | `apps/web/src/auth/onboarding/WorkspaceShell.tsx` |
| Settings | `apps/web/src/auth/pages/AuthSettingsPage.tsx` |
| Persistence (browser) | `apps/web/src/auth/onboarding/guidance-store.ts` |
| Persistence (server) | Prisma + `/api/v1/guidance/*` + `/api/v1/admin/guidance/*` |
| Admin CMS UI | `GuidanceAdminWorkspace` (future host mount) |

### Admin-ready catalog

Hosts consume a `ProductTourCatalog`:

- `createStaticTourCatalog` - fixtures / offline
- `createRemoteTourCatalog` - fetch published tours from CMS API

Administrators update tour content via admin guidance APIs without rewriting the engine or host shells.

---

## Roles

| Product role | Audience filter |
| --- | --- |
| Public Visitor | `public_visitor` |
| Client | `client_workspace`, `all_authenticated` |
| Administrator | `operations_console`, `all_authenticated`, `client_workspace` |
| Supplier (future-ready) | `supplier_portal`, `all_authenticated` |

Resolved by `resolveProductTourRole({ isAuthenticated, permissions })`.

---

## Controls

Tour runner exposes: **Next · Previous · Skip · Finish · Pause · Resume · Restart · Don’t show again**

Keyboard: `←` / `→` navigate · `Esc` pause/resume · `Ctrl/⌘+Shift+G` Learning Center

Guide menu: enable/disable modes, pause/resume, reset all, open Help Center.

---

## Settings

Authenticated Settings (`/app/settings`):

- Enable tours (guided / training)
- Disable tours
- Reset tours
- Replay individual tours
- Don’t show again
- Open Learning Center

---

## Persistence & versioning

- Completed and skipped tours are remembered per browser (and syncable via API).
- Each tour carries `version`. When CMS bumps version beyond `progress.tourVersion`, the tour is re-offered.
- `suppressedTourKeys` honors Don’t show again without deleting history.

---

## Accessibility & motion

- Dialog semantics, labelled controls, live regions for step progress
- Keyboard navigation
- `prefers-reduced-motion` disables pulse/enter animations
- Responsive panels and floating Tour control on public pages

---

## Host wiring

**Public:** `PublicProductTourGate` wraps marketing `Shell` routes; auth chrome and `/app` are excluded.

**Authenticated:** `ProductTourHost` inside `WorkspaceShell` with role from permissions and `currentPageKey` from the route.

Annotate targets with `data-guide="…"`. Public homepage hooks: `public-brand`, `public-nav`, `public-cta`.

---

## Quality

- UI unit tests: roles, versioning, runner controls (`packages/ui/src/guidance/guidance.test.tsx`)
- Host helper tests: `apps/web/src/product-tour/product-tour.test.ts`
- Run: `pnpm --filter @hamd/ui test` · `pnpm --filter @hamd/web lint|typecheck|test`
