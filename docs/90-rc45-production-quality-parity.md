# RC4.5 - Version 1 → Version 2 Migration Checklist

**Status date:** 2026-08-06  
**RC5.1 update:** Full live-route audit + reports in [docs/96](./96-rc51-v1-client-migration-report.md)–[docs/99](./99-rc51-cutover-checklist.md). Buyer host identity: `apps/client` → `apps/web`. Legacy `client-frontend` **deprecated** (not deleted). **Production cutover not approved** until checklist blockers clear.  
**Rule:** Do not remove V1 business capability. Mark each item Migrated / Improved / Pending.

| Area | V1 capability | Status | Notes |
| --- | --- | --- | --- |
| Auth | Login | **Improved + Complete** | Cookie refresh + memory access token + lockout |
| Auth | Register / verify / forgot / reset | **Complete (RC4.6)** | Real API + web pages; no mocks |
| Auth | Sessions / devices / logout everywhere | **Complete (RC4.6)** | Server sessions, devices, login history |
| Auth | Organization invitation | **Complete (RC4.6)** | Create + accept invitation journeys |
| Auth | Profile update | Improved | Settings + `PATCH /profile` |
| Catalog | Browse categories / products | Improved (partial) | Public `/products` static; no catalog API |
| Catalog | Category → create request | Improved (partial) | Workspace create wizard hosted; category handoff TBD |
| PR | Create multi-item request | **Migrated + Improved (RC5.2)** | `/app/requests/new` → `POST /api/v1/procurement-requests` |
| PR | List / filter / detail | **Migrated + Improved (RC5.2)** | `/app/requests` → API list/get; localStorage retired |
| PR | Drafts + autosave | **Improved** | Wizard autosave + draft status |
| PR | Templates | **Improved** | Built-in templates (beyond V1) |
| PR | Attachments UI | **Migrated** | Wizard + workspace upload hooks |
| PR | Budget / priority / delivery / date / notes | **Migrated** | Wizard fields |
| PR | Product search + bulk add | **Improved** | Catalog picker in wizard |
| PR | Review + approval preview | **Improved** | Review step |
| PR | Timeline / status tracking | **Improved** | 14-status machine + UI |
| PR | Duplicate / recent | **Improved** | Hosted |
| PR | Save and continue later | **Improved** | Draft save |
| PR | Comments / internal notes APIs | Pending | UI ready; API models TBD |
| Quotes | Formal quotations | **Complete (RC4.7)** | Hosted `/app/quotations` + compare/history |
| Finance | Invoices / payments | Improved (API) | Not hosted |
| Logistics | Shipments | **Complete (RC4.9)** | Hosted `/app/shipments` + map hooks |
| Comm | Notifications inbox | **Complete (RC4.8)** | Hosted `/app/notifications` + WS/polling |
| Comm | Realtime chat | **Missing (RC5.1)** | V1 Socket live; no V2 chat API - cutover blocker B2 |
| Admin | Ops triage console | Pending | Need ops host |
| Tours | Product tour | Improved | RC4.4 platform tours |

## Procurement required-feature audit (RC4.5)

| Requirement | Status |
| --- | --- |
| Drafts | Migrated |
| Autosave | Migrated |
| Templates | Migrated |
| Attachments | Migrated (client store) |
| Multiple products | Migrated |
| Bulk product selection | Migrated |
| Product search | Migrated |
| Categories | Migrated |
| Budget | Migrated |
| Priority | Migrated |
| Delivery location | Migrated |
| Delivery date | Migrated |
| Internal notes | Migrated |
| Approval preview | Migrated |
| Review screen | Migrated |
| Timeline | Migrated |
| Status tracking | Migrated |
| Duplicate request | Migrated |
| Recent requests | Migrated |
| Save and continue later | Migrated |
| Progress indicator | Migrated |
| Validation | Migrated |
| Keyboard navigation | Migrated (wizard + workspace) |
| Responsive 320–1920 | Improved (wizard + workspace breakpoints) |

## Remaining before full production cutover

1. ~~Auth recovery APIs (register / forgot / reset / verify)~~ **Done - RC4.6**
2. ~~Host quotations in `/app`~~ **Done - RC4.7**
3. ~~Host notifications in `/app`~~ **Done - RC4.8**
4. ~~Host shipments in `/app`~~ **Done - RC4.9**
5. ~~RC5.1 audit + deprecate V1 client~~ **Done - reports `docs/96`–`docs/99`**
6. ~~**Wire procurement UI to API** (replace localStorage)~~ **Done - RC5.2** (attachments/comments still deferred)
7. Chat strategy or explicit deferral - cutover blocker B2
8. Announcements feed or explicit deferral - cutover blocker B3
9. Ops console for transition commands
10. Catalog HTTP API + category → draft handoff
11. Server-backed attachments/comments (document platform)
12. Lighthouse + axe on authenticated routes in CI
13. Production WebSocket gateway for notification fan-out (polling fallback live)
14. Real map provider adapter for shipments (`mapAdapter`)
15. Document platform for shipment evidence uploads
