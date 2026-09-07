# Supplier Management

**Package:** `@hamd/ui/suppliers` (+ `@hamd/ui/suppliers.css`)  
**Rule:** Presentational workspace. Hosts wire Genesis supplier APIs when available.

## Audit

| Asset | Decision | Notes |
| --- | --- | --- |
| Prisma `SupplierStatus` + `Supplier` / `SupplierContact` | **KEEP** | Lifecycle sound; never cascade-delete |
| Quotation / PO `supplierId` FKs | **KEEP** | Commercial integrity |
| Docs/12 supplier tables (certs, assessments, bank, metrics) | **KEEP** as target | Spec ahead of schema expansion |
| Catalog “supplier” facet / product field | **REFACTOR** later | Point at real supplier IDs |
| `apps/api` supplier module | **REPLACE / NEW** | Missing today |
| Legacy supplier admin | **N/A** | No legacy domain code |

## Mission coverage

### Supplier
Profile · Contacts · Locations · Countries · Certifications · Documents · Ratings · Lead time · Performance · Communication · Products  

### Admin
Approve · Suspend · Verification · Risk score · Performance analytics  

## Import

```ts
import { SupplierWorkspace, supplierRecordsFixture } from "@hamd/ui/suppliers";
import "@hamd/ui/suppliers.css";
```

## Host wiring

```tsx
<SupplierWorkspace
  suppliers={rows}
  onAdminAction={(id, action, meta) => api.supplierAction(id, action, meta)}
  onExportCsv={(csv) => download(csv, "suppliers.csv")}
  onOpenCommunication={(href) => navigate(href)}
/>
```

Only **active** + assessed suppliers should be eligible for RFQ/PO issue (enforce in API).

## Review

See [77-supplier-management-review.md](./77-supplier-management-review.md).
