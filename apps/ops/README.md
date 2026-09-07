# Almahbub Operations Console (`@hamd/ops`)

Host app for Almahbub International operations: executive dashboard, identity, suppliers, catalog admin boards, procurement, finance, logistics, CMS, analytics, audit, and platform settings.

## Run

From the monorepo root:

```bash
corepack pnpm install
corepack pnpm --filter @hamd/ops dev
```

Dev server: [http://127.0.0.1:3001](http://127.0.0.1:3001)  
API default: `VITE_API_URL=http://127.0.0.1:4000` (see `.env.example`)

Useful scripts:

```bash
corepack pnpm --filter @hamd/ops typecheck
corepack pnpm --filter @hamd/ops test
corepack pnpm --filter @hamd/ops build
```

## Auth

Copied from `apps/web/src/auth` (same API client against `apps/api`). Successful login redirects to `/` (ops home). Shell routes require authentication **and** `ops:access`. Buyers are sent to `/unauthorized`. The API also rejects `/api/v1/ops/*` without `ops:access`. Public registration never grants Ops.

## Section map

| Path | Section | UI |
|------|---------|----|
| `/` | Executive Dashboard | `@hamd/ui/dashboard` `ExecutiveDashboard` |
| `/users` | User Management | `IdentityWorkspace` |
| `/organizations` | Organization Management | `IdentityWorkspace` (`initialTab=overview`) |
| `/suppliers` | Supplier Management | `SupplierWorkspace` |
| `/products` | Product Management | Live `/api/v1/ops/products` (no fixture catalogue) |
| `/categories` | Category Management | Live `/api/v1/ops/categories` |
| `/inventory` | Inventory Overview | Future-ready `OpsModuleBoard` |
| `/requests` | Procurement Requests | `ProcurementWorkspace` |
| `/quotations` | Quotations | `QuotationWorkspace` |
| `/purchase-orders` | Purchase Orders | `PurchaseOrderWorkspace` |
| `/invoices` | Invoices | `OpsModuleBoard` |
| `/payments` | Payments | `OpsModuleBoard` |
| `/shipments` | Shipments | `ShipmentWorkspace` (`mapAdapter={null}`) |
| `/notifications` | Notifications | `NotificationCenter` |
| `/cms` | CMS | `CmsWorkspace` |
| `/reports` | Reports | Date filters + CSV / TSV / print PDF |
| `/analytics` | Analytics | `AnalyticsWorkspace` |
| `/audit` | Audit Logs | `AuditWorkspace` |
| `/settings` | Platform Settings | `PlatformConfigWorkspace` |
| `/support` | Support Center | `OpsModuleBoard` + `GuidanceAdminWorkspace` |

Auth routes: `/login`, `/forgot-password`, `/reset-password`, `/session-expired`, `/unauthorized`.

## Data policy

Catalogue, dashboard, requests, and announcements use live `/api/v1` APIs. Do not substitute fixture products as the public catalogue. Unfinished modules (inventory, POs, analytics, settings) may still show empty/error states — they are not Phase 6A production surfaces.

Phase 6A status: **PARTIAL**. Browser lifecycle gates passed; catalog media storage is still local-disk (`docs/phase-6a-ops-integration-status.md`).
