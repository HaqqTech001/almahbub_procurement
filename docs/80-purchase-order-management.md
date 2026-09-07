# Purchase Order Management

**Package:** `@hamd/ui/purchase-orders` (+ `@hamd/ui/purchase-orders.css`)

## Audit

| Asset | Decision |
| --- | --- |
| Prisma `PurchaseOrderStatus` (`draft`→`closed`) | **KEEP** |
| PO creation via quotation `accept` | **KEEP** |
| Dedicated PO API module | **NEW** (host) - UI ready |
| Supplier acceptance | **UI workflow** (`supplierAcceptance` + commands) |
| Delivery tracking | **Links shipments** already on PO |

## Mission coverage

Creation · Approval · Supplier acceptance · Revision · History · Documents · Attachments · Delivery tracking · Status

## Import

```ts
import { PurchaseOrderWorkspace } from "@hamd/ui/purchase-orders";
import "@hamd/ui/purchase-orders.css";
```
