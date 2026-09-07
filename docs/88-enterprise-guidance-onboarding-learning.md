# Enterprise Guidance, Onboarding & Learning System

**Document:** `docs/88-enterprise-guidance-onboarding-learning.md`  
**Project:** Almahbub International V2 · Powered by HAQQ TECH  
**Phase:** 12  
**Status:** Implemented (engine + API + CMS admin + coverage registry)

---

## Executive summary

Authenticated applications (Client Workspace, Operations Console, and future Supplier/Mobile hosts) share a reusable guidance engine that delivers first-login welcome, three guide modes, interactive walkthroughs, one-time feature discovery, smart help, a Learning Center, progress sync, and CMS-administered tour content. Public marketing pages are explicitly excluded.

---

## Audit (zero-omission)

Functional authenticated surfaces are enumerated in `packages/ui/src/guidance/page-registry.ts` (`GUIDANCE_PAGE_REGISTRY`) covering:

Dashboard · Catalog · Product Details · Categories · Bookmarks · Compare · Procurement Requests · Request Wizard · Draft Requests · Quotations · Purchase Orders · Invoices · Payments · Shipments · Tracking · Notifications · Messages · Chat · Profile · Settings · Security · Organization · Suppliers · Analytics · Reports · CMS · Audit · Administration · AI Assistant · Email Center · Platform Config · Recommendations · Learning Center

**Excluded (no guidance chrome):** Home, About, Contact, Privacy, Terms, Services, Industries, Careers, News, Login/Register/Forgot (`PUBLIC_PAGES_EXCLUDED_FROM_GUIDANCE`).

Hosts must set `GuidanceRoot` `enabled={false}` / omit the provider on auth-only chrome routes that should not participate. Public marketing may mount a **lightweight** public-visitor tour via `PublicProductTourGate` (see `docs/89-interactive-product-tour-system.md`). Full authenticated guidance remains under `/app` (and future ops/supplier hosts).

---

## Architecture

| Layer | Location |
| --- | --- |
| UI engine | `@hamd/ui/guidance` - provider, welcome, control, tour runner, spotlight, tips, smart help, learning center, admin workspace |
| Styles | `@hamd/ui/guidance.css` |
| Page coverage | `page-registry.ts` + CMS-shaped `fixtures.ts` |
| Persistence | Prisma models `GuidanceTour`, `GuidanceTourStep`, `GuidanceTip`, `GuidanceUserPreference`, `GuidanceUserProgress`, `GuidanceTipDismissal` |
| Migration | `database/prisma/migrations/20260806120000_guidance_learning_system` |
| API | `/api/v1/guidance/*` (user) · `/api/v1/admin/guidance/*` (CMS/admin) |
| Permissions | `guidance:read`, `guidance:manage` |

### Lazy loading

Hosts should dynamic-import via `guidanceLazySurfaces` so the engine does not block initial render of authenticated shells.

### Host wiring

```tsx
import { lazy, Suspense } from "react";
import { ClientWorkspaceShell } from "@hamd/ui/dashboard";

const GuidanceRoot = lazy(() =>
  import("@hamd/ui/guidance").then((m) => ({ default: m.GuidanceRoot })),
);
const GuideControl = lazy(() =>
  import("@hamd/ui/guidance").then((m) => ({ default: m.GuideControl })),
);

// Authenticated only:
<Suspense fallback={null}>
  <GuidanceRoot
    preference={prefs}
    tours={tours}
    tips={tips}
    progress={progress}
    dismissedTipIds={dismissed}
    currentPageKey="dashboard"
    handlers={{ onUpdatePreference, onUpsertProgress, onDismissTip, onResetProgress }}
  >
    <ClientWorkspaceShell topBarExtra={<GuideControl />} …>
      {children}
    </ClientWorkspaceShell>
  </GuidanceRoot>
</Suspense>
```

Annotate interactive targets with `data-guide="…"` and optional smart-help attributes (`data-guide-help`, `data-guide-help-title`, `data-guide-help-purpose`, `data-guide-help-when`, `data-guide-help-outcome`).

---

## Guide modes

| Mode | Behavior |
| --- | --- |
| **OFF** | No highlights, tooltips, or automatic guidance |
| **GUIDED** (default for new users) | Contextual explanations, one-time tips, optional walkthroughs |
| **TRAINING** | Full walkthrough emphasis (stronger pulse); ideal for new employees |

Persisted in `guidance_user_preferences` (per user + organization) and synced via `PATCH /api/v1/guidance/preferences`.

Global control: `GuideControl` (top bar / user menu) - mode switch, restart current/all, Help Center, shortcut **Ctrl/⌘ + Shift + G**.

---

## Onboarding welcome

First session (no `welcomeCompletedAt`, `neverAutoStart=false`) shows:

- Welcome to Almahbub International  
- Powered by HAQQ TECH  
- What you will learn + estimated time  
- **Start Guided Tour** · **Skip for Now** · **Never Automatically Start Again**

---

## Interactive walkthroughs

Tour steps may set `requireAction` + `actionEvent` + `targetSelector`. The runner listens on the target and blocks **Next** until the interaction fires (click/focus examples for create request, filters, notifications, org switch, profile, etc.).

---

## Learning Center & admin

- **Learning Center:** search tours, launch/replay, completion %.  
- **GuidanceAdminWorkspace:** create/edit/publish/unpublish/schedule, mandatory flag, analytics, reset user progress.  
- Content is CMS-driven (DB-backed titles/bodies/selectors/order/locale) - fixtures mirror published CMS payloads for Storybook/tests.

---

## API surface

**User (`guidance:read`)**

- `GET/PATCH /api/v1/guidance/preferences`
- `GET /api/v1/guidance/tours` (published)
- `GET /api/v1/guidance/tips`
- `GET/PUT /api/v1/guidance/progress`
- `GET /api/v1/guidance/tips/dismissed`
- `POST /api/v1/guidance/tips/dismiss`
- `POST /api/v1/guidance/progress/reset`

**Admin (`guidance:manage`)**

- CRUD/publish/schedule tours under `/api/v1/admin/guidance/tours…`
- `GET /api/v1/admin/guidance/analytics`
- `POST /api/v1/admin/guidance/users/:userId/reset-progress`

---

## Accessibility · motion · performance · security

- Dialogs use `role="dialog"`, labelled titles, focus on open, Escape closes menus.  
- `prefers-reduced-motion` disables pulse/enter animations.  
- Spotlight uses ResizeObserver + scroll listeners only while a tour is active.  
- Preferences/progress are user-scoped; admin mutations require `guidance:manage`; Zod validates CMS payloads; audit events written on mutations.

---

## Deployment notes

1. Apply migration `20260806120000_guidance_learning_system`.  
2. `pnpm --filter @hamd/database exec prisma generate` (or workspace generate).  
3. Seed permissions `guidance:read` / `guidance:manage` (included in development seed).  
4. Assign permissions to client + admin roles.  
5. Publish baseline tours via admin API or seed job (UI fixtures for local).  
6. Wire `GuidanceRoot` only inside authenticated app routers; keep marketing SSR free of the engine.

---

## Final review checklist

| Review | Result |
| --- | --- |
| Architecture | Pass - layered UI/API/DB with injectable handlers |
| UX | Pass - welcome, modes, learning center, non-blocking tips |
| UI | Pass - premium sparse chrome, no public-page bleed |
| Accessibility | Pass - keyboard, dialogs, reduced motion, labels |
| Performance | Pass - lazy surfaces, observer scoped to active tour |
| Security | Pass - authz permissions, validated input, user-scoped progress |
| Documentation | Pass - this document |
| Testing | Pass - UI coverage + schema tests |
| Technical debt | Accepted - host apps must mount targets/`data-guide` hooks; translation admin UI is locale-field ready (full i18n matrix later) |

**STOP criteria:** Deliverables above are production-ready for host integration.
