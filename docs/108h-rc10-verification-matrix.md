# RC10 - Verification Matrix

**Legend:** Pass · Fail · N/A · Residual (documented in [108g](./108g-rc10-known-issues.md))

## Modules / domains

| Module | API | Buyer UI | Ops UI | RBAC/policy | Tests | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Identity / auth | `/api/v1/auth/*` | Login–settings | Login | Session + permissions | api + web | Pass |
| Procurement requests | `/api/v1/procurement-requests` | `/app/requests*` | Requests | `request:*` | state + schemas | Pass |
| Quotations | `/api/v1/quotations` | `/app/quotations*` | Quotations | `quotation:*` | state + schemas | Pass |
| Invoices | `/api/v1/invoices` | via workspace/API | Invoices | `invoice:*` | schemas | Pass |
| Payments | `/api/v1/payments` | via workspace/API | Payments | `payment:*` | state + schemas | Pass |
| Shipments | `/api/v1/shipments` | `/app/shipments*` | Shipments | `shipment:*` | state + schemas | Pass |
| Notifications | `/api/v1/notifications*` | `/app/notifications` | Notifications | `notification:*` | schemas + policy | Pass |
| Guidance | `/api/v1/guidance*` | tours in workspace | - | `guidance:*` | schemas | Pass |
| Ops | `/api/v1/ops/*` | - | Dashboard+modules | `ops:access` + anyOf | require-permission | Pass |
| Announcements / support / marketing / services | parity routers | public + `/app/chat` | CMS/support | manage perms | parity | Pass |
| AI copilot | `/api/v1/ai/copilot/*` | embedded panels | AI + POs | `ai:use` / domain read | copilot tests | Pass (needs keys in prod) |
| Health / OpenAPI | `/health/*`, `/openapi.json` | - | - | public | health tests | Pass |

## Buyer pages (`apps/web`)

| Route | Verified |
| --- | --- |
| `/` homepage | e2e + axe |
| `/about` `/services` `/products` `/product/:slug` `/industries` `/faq` `/contact` | e2e loads + typecheck |
| `/announcements*` `/privacy` `/terms` `/cookies` | routes present |
| Auth: login/register/forgot/reset/verify/otp/invite/status | routes + auth tests |
| `/app` workspace modules | typecheck + API clients + unit |
| `/robots.txt` `/sitemap.xml` | e2e static |

## Ops pages (`apps/ops`)

Dashboard, users/orgs, suppliers, products, categories, inventory, requests, quotations, POs, invoices, payments, shipments, notifications, CMS, reports, analytics, audit, settings, support, AI - routed in `App.tsx`, guarded by `RequireOpsAccess`.

## Workflows (state machines)

| Workflow | Enforced in |
| --- | --- |
| Procurement request commands | `procurement-request-state.ts` |
| Quotation transitions | `quotation-state.ts` |
| Invoice transitions | `invoice-state.ts` |
| Payment transitions | `payment-state.ts` |
| Shipment transitions | `shipment-state.ts` |

## Permissions (seed + route policy)

Core keys include `request:*`, `quotation:*`, `invoice:*`, `payment:*`, `shipment:*`, `notification:*`, `communication:*`, `guidance:*`, `ops:access`, `audit:read`, `ai:use`, `cms:manage`.  
Central catalog: `apps/api/src/routes/route-policy.ts` + domain policies.

## Final reviews

| Review | Result |
| --- | --- |
| Security | Rate limits, RBAC, Zod, sessions, audit high-gate, gitleaks/Trivy in CI - Pass |
| Performance | Route split, critical CSS, self-hosted fonts, session-hint auth, LH ≥95 - Pass |
| Accessibility | Skip link, landmarks, contrast, Playwright axe WCAG AA - Pass |
| Regression | api/web/ops unit + web e2e - Pass |
| Lighthouse | Perf 95 · A11y 100 · BP 100 · SEO 100 - Pass |

## Smoke (manual, staging/prod)

- [ ] Auth register → verify → login → refresh → logout
- [ ] Create procurement request → transition happy path
- [ ] Quotation issue/review path
- [ ] Shipment timeline read
- [ ] Ops product create/update with write permission
- [ ] Support thread message
- [ ] Copilot configured or explicit 503
