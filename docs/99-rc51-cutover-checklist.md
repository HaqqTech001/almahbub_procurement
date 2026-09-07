# RC5.1 - Cutover Checklist

**Status date:** 2026-08-06  
**From:** `client-frontend` (V1 buyer SPA)  
**To:** `@hamd/client` → `apps/web` (`/app/*` + public + auth)  
**Rule:** Do not switch production traffic until **Blockers** are Done or Explicitly Deferred with sign-off.

---

## Verdict gate

| Gate | Status |
| --- | --- |
| Feature parity confirmed (all live V1 buyer workflows) | **OPEN** - see blockers |
| Legacy deprecated (not deleted) | **DONE** - `client-frontend/DEPRECATED.md` |
| Reports published | **DONE** - `docs/96`–`docs/99` |

---

## A. Blockers (must clear)

| # | Item | Owner | Done when | Status |
| --- | --- | --- | --- | --- |
| B1 | Procurement requests use `apps/api` (not localStorage) | Eng | Create/list/detail survive cross-device | **DONE (RC5.2)** - attachments/comments still deferred |
| B2 | Support chat on V2 **or** signed deferral + alternate channel | Eng / Product | Chat live **or** memo in `docs/` + support SLA | **OPEN** |
| B3 | Buyer announcements feed **or** signed deferral | Eng / Product | Feed live **or** memo | **OPEN** |
| B4 | Product sign-off that Partial rows (help alias, profile edit, dashboard stats, subcategory IA) are acceptable for go-live | Product | Written approval | **OPEN** |

---

## B. Pre-cutover engineering

| # | Item | Status |
| --- | --- | --- |
| E1 | Production `apps/api` + Postgres + Redis healthy | |
| E2 | `apps/web` production build + CDN/host | |
| E3 | Auth cookies: Secure, correct domain, CSRF strategy verified | |
| E4 | CORS / cookie origins allow web host only | |
| E5 | Email provider live (verify, reset) | |
| E6 | Notification WS or polling verified in staging | |
| E7 | Quotation + shipment read paths verified for seeded buyers | |
| E8 | Error tracking (Sentry or equivalent) on web + api | |
| E9 | Run regression pack in [docs/98](./98-rc51-regression-report.md) §4 | |
| E10 | Redirect map: key V1 URLs → V2 (`/dashboard`→`/app`, `/my-requests`→`/app/requests`, `/create-request`→`/app/requests/new`, `/profile`→`/app/settings`, `/chat`→ TBD) | |

---

## C. Data & ops

| # | Item | Status |
| --- | --- | --- |
| D1 | Buyer identity migration / invite plan (V1 users → V2 org) | |
| D2 | Open procurement requests migration or freeze window | |
| D3 | Notification history: migrate, rebuild, or accept reset | |
| D4 | Chat history: migrate, export, or accept loss (if chat deferred) | |
| D5 | Ops runbook for first 72h (rollback DNS, support macros) | |

---

## D. Cutover day

| # | Step | Status |
| --- | --- | --- |
| C1 | Freeze V1 client deploys | |
| C2 | Announce maintenance / switch window | |
| C3 | Switch DNS / reverse proxy to `apps/web` | |
| C4 | Smoke: login, create request (API), notifications, quotes, shipments | |
| C5 | Confirm `/chat` behaviour matches B2 decision | |
| C6 | Monitor error rates + auth failures 2h | |
| C7 | Keep `client-frontend` runnable for emergency rollback (do not delete) | |

---

## E. Post-cutover

| # | Item | Status |
| --- | --- | --- |
| P1 | 7-day watch on auth + PR + notifications | |
| P2 | Close residual Partial items (help route, profile edit) or ticket them | |
| P3 | Update customer-facing help links | |
| P4 | Mark cutover complete in this doc + engineering handbook | |
| P5 | Leave `client-frontend/` deprecated archive indefinitely | |

---

## F. Explicit deferral template (for B2 / B3)

If product defers a Missing workflow, attach a short memo:

```
Deferred capability: <chat | announcements>
Alternate channel: <email / phone / Intercom / …>
Buyer impact: <who / how often>
Revisit date: <YYYY-MM-DD>
Signed: <name> <date>
```

Without this memo, the blocker stays **OPEN**.

---

## Related

- [Migration report](./96-rc51-v1-client-migration-report.md)
- [Parity matrix](./97-rc51-feature-parity-matrix.md)
- [Regression report](./98-rc51-regression-report.md)
