# RC-FIX-08 - SPA skeleton lock + global theme consistency

**Status:** Implemented and browser-verified (STOP - no next module).  
**Date:** 2026-08-10

Definition of done:

Login → Dashboard → any protected page → any other protected page → back to Dashboard, without infinite skeleton, hard refresh, or second login. Every implemented page honors the same active theme.

---

## A. Skeleton / navigation bug

### Exact root cause (three compounding links)

1. **Full document navigations from the workspace sidebar**  
   `ClientWorkspaceShell` used raw `<a href>` without client-side routing. Each click reloaded the document. That looked like “hard refresh required to see content,” and it destroyed in-memory auth (access JWT) on every hop.

2. **Nested `React.lazy` + `Suspense` around the authenticated layout**  
   Wrapping `WorkspaceShell` in `LazyPage` meant navigating `/app` children could remount the shell Suspense boundary. Dashboard (eager, same chunk) rendered; sibling lazy pages stayed on `HostLoading`.

3. **Auth bootstrap could stay `bootstrapping === true` forever**  
   `AuthProvider` used a `bootstrapped` / cancel flag. React StrictMode (and HMR) cancelled the first bootstrap; the second run could skip work and never clear `bootstrapping`. `RequireAuth` then rendered `.hamd-auth-boot` indefinitely.

First broken lifecycle step: **sidebar click → full page load** (not a failed API). After that, auth memory + Suspense made SPA hops look stuck on skeleton.

### Exact files

| File | Change |
| --- | --- |
| `packages/ui/src/dashboard/ClientWorkspaceShell.tsx` | `onNavigate` + `preventDefault` for in-app links |
| `apps/web/src/auth/onboarding/WorkspaceShell.tsx` | `onNavigate={(href) => navigate(href)}`; `Suspense` only around `<Outlet />` |
| `apps/web/src/App.tsx` | Eager `WorkspaceShell` + `WorkspaceHomePage`; layout is `<RequireAuth><WorkspaceShell /></RequireAuth>` |
| `apps/web/src/auth/session/AuthProvider.tsx` | Mount-only bootstrap; generation counter so StrictMode cancel cannot leave bootstrapping true |
| `apps/web/src/components/HostChrome.tsx` | `HostBackLink` uses React Router `Link` |
| `apps/ops/src/shell/OpsShell.tsx` | Same SPA `onNavigate` wiring |

### Exact fix

- Authenticated layout is a **stable shell**. Child routes swap inside `<Outlet />`.
- Sidebar / brand / profile / settings / notifications use **client-side `navigate`**.
- Auth bootstrap runs **once per provider mount**, not per route.
- Page `Suspense` fallback is scoped to the outlet, not the whole shell.

### Why it happened

The workspace chrome was built as a marketing-style HTML nav, then dropped into a SPA. Combined with lazy layout + a StrictMode-hostile bootstrap, the first client-side hop never completed the expected render path.

### Why the fix is permanent

- Provider placement is above the router tree (`main.tsx`: `BrowserRouter` → `AppProviders` → `AuthProvider` → `App`).
- Layout route does not remount AuthProvider or the shell on child navigation.
- Navigation no longer does `window.location` / full reloads.
- No delayed skeleton timeout or forced reload workaround.

---

## B. Authentication

| Concern | Behavior |
| --- | --- |
| Auth provider | Mounted once in `main.tsx`. Not inside `/app` layout. Survives child route changes. |
| Session | Memory access JWT + `sessionHint` + httpOnly refresh cookie (`hamd_refresh`) + CSRF. |
| Refresh | Single-flight via `refreshPromise` ref. Concurrent callers share one refresh. |
| 401 | Session missing/expired → `ensureSession` refreshes once; failure → `expired` → `/session-expired` (not a generic “Unauthorized”). Login 401 is “Invalid email or password.” |
| 403 | `AuthApiError.isForbidden`. Used for unverified-email on login (redirect to OTP). Module APIs do **not** log the user out on 403. |

No TanStack Query in `apps/web`. Data is local `useState` + `useEffect` with `finally { setLoading(false) }`.

---

## C. Data layer

- **QueryClient:** not used in buyer web. No per-route QueryClient.
- **Query lifecycle:** each page `refresh()` sets loading true, fetches with `require*Token(auth.ensureSession)`, then success or `HostAlert` error, and always clears loading in `finally`.
- **Loading / success / empty / error:** `HostLoading` only while `loading`; errors surface as `HostAlert`; empty lists render empty UI (e.g. “Select a procurement request”), not a permanent skeleton.

---

## D. Theme

**Token source:** `@hamd/design-tokens` + CSS variables on `:root` / `[data-theme="dark"]` in `@hamd/ui` (`homepage-sections.css` / `foundation.css`). Buyer web `ThemeProvider` (`hamd.web.theme`) writes `document.documentElement.dataset.theme`. Ops uses `hamd.ops.theme` (separate app).

**Anti-FOUC:** inline script in `apps/web/index.html` and `apps/ops/index.html` applies stored theme before paint. `ThemeProvider` hydrates from `localStorage` on first render (`useLayoutEffect`).

**Pages audited**

| Surface | Routes |
| --- | --- |
| Public | `/`, `/about`, `/services`, `/products`, `/product/:slug`, `/industries`, `/contact`, `/faq`, `/announcements`, legal |
| Auth | `/login`, `/register`, `/verify-email`, `/otp`, `/forgot-password`, `/reset-password`, `/invite`, status pages |
| Buyer workspace | `/app`, `/app/requests`, `/app/requests/new`, `/app/quotations` (+ compare/history/:id), `/app/shipments`, `/app/notifications`, `/app/profile`, `/app/settings`, `/app/chat` |
| Not implemented on buyer web | `/app/orders`, `/app/invoices` (ops console only) |

**Inconsistent pages found / fixed**

- Hardcoded `#fff` surfaces in `apps/web/src/styles/foundation.css` and `auth-host.css` → `--hamd-color-surface`
- Page canvas → `--hamd-color-canvas`
- Skeleton shimmer mixed with `#fff` → mix against `--hamd-color-surface` (respects dark theme)
- Theme toggle writing localStorage but reload overwriting via init script - init now seeds only when unset; toggle is the source of truth

**Components standardized:** `hamd-btn`, `HostAlert` / `HostLoading` / `HostPage` / `HostBackLink`, shared shell chrome. Auth screens remain `@hamd/ui/auth`.

**Light / dark:** dashboard and requests verified in both themes (see evidence). Theme persists Public → Login → `/app` and across SPA hops.

---

## E. Browser evidence

Playwright (Chromium desktop, real API on `:4000`, Vite on `:3000`):

`apps/web/e2e/rc-fix-08-spa-nav-theme.spec.ts` - **passed** (1.4m).

Journey (no hard refresh between hops):

Login → `/app` → Requests → Quotations → Shipments → Notifications → Profile → Settings → Dashboard → **one** reload → Requests → Quotations → **theme toggle to dark** → Requests → Settings → `/` → `/login` → login → `/app` → mobile 390px Requests via drawer.

Screenshots: `apps/web/e2e/evidence/rc-fix-08/`

| File | What it shows |
| --- | --- |
| `01-dashboard-light.png` | Authenticated dashboard, light theme, Almahbub International shell |
| `02-requests-dark.png` | SPA-navigated Requests, dark theme, empty success state (not skeleton) |
| `03-dashboard-dark.png` | Theme persisted after public + re-login |
| `04-requests-mobile-dark.png` | 390px drawer nav, dark theme |

Session: same user after dashboard reload; no second login until the explicit public→login theme check.

---

## F. Quality

| Gate | Result |
| --- | --- |
| Lint (`@hamd/web`) | Pass |
| Typecheck (`@hamd/web`) | Pass |
| Unit tests (auth + HostChrome) | 10 passed |
| Build (`@hamd/web`) | Pass |
| E2E RC-FIX-08 | Pass (`chromium-desktop`) |
| Accessibility | Skip link, `aria-busy` on loaders, theme switch `role="switch"`, drawer `aria-label`; skeletons have sr-only labels |

---

## STOP

Do not start another feature until this sprint is accepted. The buyer SPA now navigates authenticated routes through the router with a stable auth shell and one theme source of truth.
