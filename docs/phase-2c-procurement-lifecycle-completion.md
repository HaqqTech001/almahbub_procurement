# Phase 2C — Procurement Lifecycle Implementation Report

**Status:** Implementation complete for Gates 1–13 with automated unit coverage.  
**Production-ready:** **No** — full browser/axe/security matrix against live credentials was not completed in this environment (E2E credentials unset).  
**Next phase:** Do not start. Stop after Phase 2C.

---

## 1. What changed

- Centralized authenticated `sessionFetch` (401 → single refresh → retry; 403 untouched; failed refresh → clear session → `/login?returnTo=…`).
- Read-only request related aggregation on existing GET request/list payloads (`related` + `history` + org fields).
- Customer Request Hub (`/app/requests`) + Detail (`/app/requests/:id`) with lifecycle, related records, role-filtered actions.
- Admin Request Hub (`/requests`) + Detail (`/requests/:id`) with ops-only commands.
- Customer notification dropdown (latest 5, unread red dot, href routing).
- Admin Users responsive cards + mobile full-screen detail (desktop drawer retained).
- Customer/Admin action separation via lifecycle helpers (quotation accept/decline vs ops review/issue/request transitions).

## 2. Files changed (primary)

### Shared UI
- `packages/ui/src/auth/session-retry.ts` (+ tests)
- `packages/ui/src/procurement/lifecycle.ts` (+ tests)
- `packages/ui/src/procurement/RequestHub.tsx`
- `packages/ui/src/procurement/RequestDetailView.tsx`
- `packages/ui/src/procurement/types.ts`
- `packages/ui/src/procurement/index.ts`
- `packages/ui/src/styles/procurement.css`
- `packages/ui/src/dashboard/ClientWorkspaceShell.tsx`
- `packages/ui/src/dashboard/types.ts`
- `packages/ui/src/notifications/resolve-notification-href.ts` (existing)

### API
- `apps/api/src/modules/procurement/api/procurement-request-related.ts` (+ tests)
- `apps/api/src/modules/procurement/api/procurement-request-controller.ts`
- `apps/api/src/modules/procurement/application/procurement-request-service.ts`
- `apps/api/src/modules/procurement/infrastructure/procurement-request-repository.ts`

### Web
- `apps/web/src/auth/session/session-http.ts`, `AuthProvider.tsx`, `RequireAuth.tsx` (+ test)
- `apps/web/src/procurement/ProcurementRequestsPage.tsx`
- `apps/web/src/procurement/ProcurementRequestDetailPage.tsx` (new)
- `apps/web/src/procurement/procurement-api.ts`
- `apps/web/src/notifications/CustomerNotificationMenu.tsx` (new)
- `apps/web/src/auth/onboarding/WorkspaceShell.tsx`
- `apps/web/src/App.tsx`
- sessionFetch wired into quotation/shipment/finance/notification APIs
- `apps/web/e2e/phase-2c-request-lifecycle.spec.ts`

### Ops
- `apps/ops/src/auth/session/session-http.ts`, `AuthProvider.tsx`
- `apps/ops/src/modules/RequestsPage.tsx`, `RequestDetailPage.tsx` (new)
- `apps/ops/src/modules/UsersPage.tsx` (+ test)
- `apps/ops/src/api/procurement-api.ts` (+ sessionFetch)
- sessionFetch wired into quotation/shipment/notification APIs; `ops-fetch.ts` already uses sessionFetch
- `apps/ops/src/styles/ops.css`
- `apps/ops/src/App.tsx`
- `apps/ops/e2e/phase-2c-request-lifecycle.spec.ts`

## 3. API changes

- GET `/procurement/requests` and GET `/procurement/requests/:id` now include:
  - `organizationId`, `organizationName`
  - `related`: quotations, purchaseOrders, shipments, invoices, payments (real Prisma relations only)
  - `history`: status events with actor names
- Buyer list scoping: without `request:manage`, owner is forced to the authenticated user.
- No new models, no mutations, no invented statuses.

## 4. UI changes

- Customer hub/detail vs Admin hub/detail (separate experiences).
- Mobile request cards; desktop tables.
- Lifecycle stage presentation mapped from real V2 statuses.
- Empty related records show **Not available yet**.
- Customer quotation Accept/Decline only when policy allows; never “Approve Request”.
- Admin Users: cards &lt;768; full-screen detail on mobile; drawer on desktop.

## 5. Database changes

- None (schema/migrations unchanged).

## 6. Security changes

- Session expiry handled centrally; tokens not placed in URLs.
- 403 remains authorization failure.
- Buyer → Admin still gated by `ops:access` → `/unauthorized`.
- Related aggregation inherits existing request authorization / org scope.

## 7. Customer / Admin responsibility matrix

| Action | Customer | Admin/Ops |
|---|---|---|
| Create / draft / submit request | Yes | Ops may also manage per policy |
| Review / accept_for_sourcing / start_sourcing / fulfill / close | No | Yes (`request:manage`) |
| Accept / decline quotation | Yes (`quotation:respond`) | No (ops review/issue) |
| Review / issue quotation | No | Yes |
| Manage catalogue / users / orgs / announcements | No | Permission-gated |
| View own org-scoped records | Yes | Broader ops scope |

## 8. Responsive results by viewport

| Viewport | Automated result |
|---|---|
| 320–480 request cards CSS | Implemented (cards &lt;768, table ≥768) |
| Users cards / mobile detail CSS | Implemented |
| Playwright overflow matrix | Spec written; **not executed with credentials** |
| Manual browser matrix | **Not executed in this run** |

## 9. Accessibility results

- Unit/UI structure includes labels, Escape closes notification menu & user detail, focus return on bell.
- Playwright + axe specs added for requests/users.
- **axe was not executed against live authenticated pages in this run** (missing E2E env).

## 10. Browser test results

| Suite | Result |
|---|---|
| `@hamd/ui` session-retry + lifecycle | **Pass** (8 tests) |
| `@hamd/api` procurement-request-related | **Pass** (4 tests) |
| `@hamd/web` RequireAuth | **Pass** (4 tests) |
| `@hamd/ops` UsersPage | **Pass** (2 tests) |
| `@hamd/web` / `@hamd/ops` `tsc --noEmit` | **Pass** after UI rebuild |
| Playwright Phase 2C customer/admin | Authenticated cases **skipped** without E2E credentials. Unauthenticated `returnTo` **Pass** against live Vite (`http://127.0.0.1:3000`). |

## 11. Exact failures

- UsersPage test initially failed on duplicate name nodes (cards+table); fixed with `getAllBy*`.
- Playwright returnTo against stale preview `:4173` initially failed (existing server / session pollution); re-run against live Vite `:3000` **passed**.

## 12. Remaining blockers

1. Set `HAMD_BUYER_E2E_EMAIL/PASSWORD` and `HAMD_OPS_E2E_EMAIL/PASSWORD`, then run Playwright Phase 2C specs + axe.
2. Manually verify session expiry (expire access, refresh success/fail) for customer and admin.
3. Verify request→quotation→shipment aggregation against real multi-relation fixtures.
4. Full responsive matrix (320…1920) across all listed Admin/Customer pages.
5. Full security matrix (cross-org request/quotation denial) against live API.

## 13. Production-readiness status

**Not production-ready yet** under the Phase 2C stop conditions, because browser/axe/security/session expiry were not fully executed with real credentials in this environment.

Implementation for Gates 1–13 is in place and unit-tested. Complete Gate 16 browser evidence before declaring production-ready.

---

**STOP.** Do not begin another phase automatically.
