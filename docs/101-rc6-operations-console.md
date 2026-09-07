# RC6 - Operations Console

**Status date:** 2026-08-06  
**Host:** `apps/ops` (`@hamd/ops`) - http://127.0.0.1:3001  
**API:** `GET/POST /api/v1/ops/*` on `apps/api`

## Mission

Enterprise Operations Console - queue-first command center, not an admin template.
Reuses `@hamd/ui` workspaces, shared auth against `apps/api`, and RBAC permissions.

## Sections hosted

| Section | Route | Data |
| --- | --- | --- |
| Executive Dashboard | `/` | Live `/ops/dashboard` + fixture fallback |
| Users | `/users` | Live `/ops/identity` + fixtures |
| Organizations | `/organizations` | Same identity workspace |
| Suppliers | `/suppliers` | Live `/ops/suppliers` + fixtures |
| Products | `/products` | Live `/ops/products` + OpsModulePage |
| Categories | `/categories` | Live `/ops/categories` |
| Inventory | `/inventory` | Future-ready OpsModulePage |
| Procurement Requests | `/requests` | Live procurement API |
| Quotations | `/quotations` | Live quotation API |
| Purchase Orders | `/purchase-orders` | Live `/ops/purchase-orders` + fixtures |
| Invoices | `/invoices` | Live invoice API + OpsModulePage |
| Payments | `/payments` | Live payment API + OpsModulePage |
| Shipments | `/shipments` | Live shipment API |
| Notifications | `/notifications` | Live notification API |
| CMS | `/cms` | CmsWorkspace fixtures (API pending) |
| Reports | `/reports` | Generate CSV/Excel/PDF + optional `/ops/reports` |
| Analytics | `/analytics` | AnalyticsWorkspace fixtures |
| Audit Logs | `/audit` | Live `/ops/audit-events` (who/when/what/before/after) |
| Platform Settings | `/settings` | PlatformConfigWorkspace fixtures |
| Support Center | `/support` | Tickets OpsModulePage + guidance admin |

## Module chrome (every list surface)

Search · Filters · Sorting · Pagination · Bulk actions · Export · Import · Responsive · Dark mode · A11y · Loading · Empty · Error · Success - via `OpsModulePage` and/or `@hamd/ui` workspaces.

## Dev

```sh
corepack pnpm --filter @hamd/ops dev
# ensure CORS includes http://127.0.0.1:3001
corepack pnpm --filter @hamd/api dev
```

## Quality

```sh
corepack pnpm --filter @hamd/ops lint
corepack pnpm --filter @hamd/ops typecheck
corepack pnpm --filter @hamd/ops build
corepack pnpm --filter @hamd/ops test
```
