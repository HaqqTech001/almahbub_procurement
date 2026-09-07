# Quotation Management

**Package:** `@hamd/ui/quotations` (+ `@hamd/ui/quotations.css`)  
**API:** **KEEP** `apps/api` quotation module (`draft → internally_reviewed → issued → accepted|declined`, plus `revise` / `superseded` / `expired`).

## Audit

| Asset | Decision | Notes |
| --- | --- | --- |
| Prisma `Quotation` + family/version/history/documents | **KEEP** | Commercial amounts, expiry, currency |
| Domain commands `review` / `issue` / `accept` / `decline` | **KEEP** | Policy-enforced transitions |
| Routes create/update/transitions/revise/history | **KEEP** | Hosts inject handlers |
| Mission “Approval/Rejection” labels | **Alias** | UI copy maps to review/issue/accept/decline |
| `@hamd/ui/quotations` | **NEW** | This package |

## Mission coverage

| Support | Implementation |
| --- | --- |
| Create | Create tab → `onCreate` |
| Revision | `onRevise` + version list |
| Approval | Internal `review` / `issue`; buyer `accept` |
| Rejection | `decline` |
| Version history | Family versions panel |
| Attachments | Documents + upload |
| Currency / Taxes / Discount / Expiry | Commercial panel |
| Acceptance | Accept action on issued quotes |
| Negotiation | Negotiation notes + commercial terms |

## Import

```ts
import { QuotationWorkspace, quotationRecordsFixture } from "@hamd/ui/quotations";
import "@hamd/ui/quotations.css";
```

## Host wiring

```tsx
<QuotationWorkspace
  quotations={rows}
  onCreate={(input) => api.post("/quotations", input)}
  onTransition={(id, command, meta) =>
    api.post(`/quotations/${id}/transitions`, { command, ...meta })
  }
  onRevise={(id, meta) => api.post(`/quotations/${id}/revise`, meta)}
/>
```

## Review

See [79-quotation-management-review.md](./79-quotation-management-review.md).
