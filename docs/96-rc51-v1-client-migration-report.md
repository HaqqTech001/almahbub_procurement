# RC5.1 - V1 Client Frontend Migration Report

**Status date:** 2026-08-06  
**Mission:** Migrate every buyer workflow from Version 1 `client-frontend` into the V2 buyer client.  
**Verdict:** Migration of **live V1 buyer routes is substantially complete** on the V2 host. **Full production cutover is NOT approved** - three hard blockers remain (see §5).

---

## 1. Destination naming

| Spec name | Reality |
| --- | --- |
| `apps/client` | Identity package `@hamd/client` - scripts proxy to `@hamd/web` |
| Runtime | `apps/web` (`@hamd/web`) |
| Buyer workspace | `/app/*` |
| Legacy | `client-frontend/` - **deprecated, archived in place, not deleted** |

Product docs that say “buyer lives in `apps/client`” resolve to `@hamd/client` → `@hamd/web`.

---

## 2. What was audited

| Source | Scope |
| --- | --- |
| `client-frontend/src/App.tsx` | All mounted routes |
| Orphan pages (imported nowhere) | MyOrders, OrderDetail, ChatPage1, commented PDP |
| `apps/web/src/App.tsx` | Public + auth + `/app` workspace |
| `apps/api` routers | Auth, PR, quotations, invoices, payments, shipments, notifications |
| Known V1 defects | Cancel order stub, contact POST stub, file FormData gaps, mocked resend |

---

## 3. Migration outcome by surface

### 3.1 Public marketing

| V1 | V2 | Outcome |
| --- | --- | --- |
| `/` | `/` | Migrated / redesigned |
| `/services` | `/services`, `/services/:slug` | Migrated / improved |
| `/category/:slug` (+ subcategories) | `/products`, `/product/:slug`, industries | Migrated / improved (catalog model changed) |
| `/about`, `/faq`, `/contact` | Same paths | Migrated |
| `/privacy`, `/terms` | Same + `/cookies` | Migrated / improved |
| `/help` | FAQ + contact + workspace guidance | Partial (no dedicated `/help`) |
| `/announcements`, `/announcement/:id` | Static campaign banner only | **Missing** (no buyer CMS feed) |

### 3.2 Authentication

| V1 | V2 | Outcome |
| --- | --- | --- |
| Login / register / forgot / reset / verify | Full suite + OTP / invite / lockout / session-expired | **Improved** (RC4.6) |
| Profile | `/app/settings` (+ sessions, devices, invite, tours) | Partial → profile fields mostly read-only |
| - | Invitation accept, device revoke, logout-all | **Exceeds V1** |

### 3.3 Buyer workspace

| V1 | V2 | Outcome |
| --- | --- | --- |
| `/dashboard` | `/app` | Migrated (lighter stats) |
| `/create-request` | `/app/requests/new` | Migrated / improved - **RC5.2 API** (attachments deferred) |
| `/my-requests`, `/request/:id` | `/app/requests` | Migrated / improved - **RC5.2 API** |
| `/notifications` | `/app/notifications` | Migrated / improved (RC4.8) |
| `/chat`, `/chatbot-settings` | - | **Missing** (no V2 chat API) |
| - | `/app/quotations` (+ compare, history, detail) | **Exceeds V1** (RC4.7) |
| - | `/app/shipments` (+ detail) | **Exceeds V1** (RC4.9) |

### 3.4 Explicitly out of scope for this SPA migration

| Item | Reason |
| --- | --- |
| V1 admin-only announcement create | Ops host, not buyer client |
| Orphan MyOrders / OrderDetail | Never mounted in V1 router |
| Commented product PDP | Not a live V1 workflow |
| Invoices / payments UI | Not a live V1 client workflow (API exists in V2) |

---

## 4. Archival actions taken

1. Added `client-frontend/DEPRECATED.md` - do not add features; do not delete.
2. Added `apps/client/` identity (`README.md` + `@hamd/client` package).
3. Updated `legacy/README.md` and root `README.md` to mark V1 client deprecated.
4. Generated parity, regression, and cutover docs (`docs/97`–`docs/99`).

**Not done (by policy):** physical delete or `git mv` of `client-frontend/` (breaks path citations and deploy roots). Archive remains **in place**.

---

## 5. Cutover blockers (must clear before production traffic switch)

1. **Support chat** - V1 Socket.IO chat has no equivalent module in `apps/api`.
2. **Buyer announcements feed** - V1 list/detail API not replaced (static campaign ≠ CMS announcements).

~~3. Procurement persistence~~ **Closed - RC5.2** (wizard draft autosave remains local; records are API-backed).

Until remaining blockers are closed or explicitly deferred with written product sign-off, **parity is not confirmed for production cutover**.

---

## 6. Recommended next RCs

| RC | Work |
| --- | --- |
| RC5.2 | Wire `/app/requests*` to procurement API + attachment store |
| RC5.3 | Chat strategy: port Socket gateway **or** product deferral memo |
| RC5.4 | Announcements domain **or** deferral memo |
| RC5.5 | Profile edit UI on settings; optional `/help` alias |
| RC5.6 | Production cutover after checklist green |

---

## Related documents

- [Feature parity matrix](./97-rc51-feature-parity-matrix.md)
- [Regression report](./98-rc51-regression-report.md)
- [Cutover checklist](./99-rc51-cutover-checklist.md)
- [RC4.5 parity checklist](./90-rc45-production-quality-parity.md)
