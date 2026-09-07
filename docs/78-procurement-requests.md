# Procurement Requests

**Package:** `@hamd/ui/procurement` (+ `@hamd/ui/procurement.css`)  
**API:** `KEEP` `apps/api` 14-status lifecycle - UI does not collapse statuses.

## Audit

| Asset | Decision | Notes |
| --- | --- | --- |
| Prisma + domain transitions | **KEEP** | Exact statuses & commands |
| Routes `/procurement-requests` | **KEEP** | list/create/get/update/transitions |
| Mission 9 labels | **Alias only** | Display layer via `missionPhaseForStatus` |
| Homepage marketing timeline | **KEEP** | Separate from this workspace |
| Comments / attachments / notes APIs | **NEW** (host) | UI ready with handlers |
| `@hamd/ui/procurement` | **NEW** | This package |

## Status mapping (mission → code)

| Mission | Code |
| --- | --- |
| Draft | `draft` |
| Submitted | `submitted` (+ clarification loop) |
| Review | `submitted` / `accepted_for_sourcing` |
| Pending Supplier | `sourcing` |
| Quoted | `quote_issued` |
| Approved | `approved` |
| Rejected | `declined` |
| Cancelled | `cancelled` |
| Closed | `closed` (+ fulfilled path) |

## Features

| Feature | UI |
| --- | --- |
| Autosave | `useRequestDraft` → `onAutosave` (draft PATCH) |
| Timeline | Status events panel |
| Comments | Feed + composer |
| Attachments | List + upload |
| Internal notes | Ops-only panel |
| History | Status history list |
| Approvals | Approval records + lifecycle commands |
| Notifications | Linked notification hints |
| Activity | Unified activity feed |

## Import

```ts
import {
  ProcurementWorkspace,
  procurementRequestsFixture,
  availableCommands,
} from "@hamd/ui/procurement";
import "@hamd/ui/procurement.css";
```

## Host wiring

```tsx
<ProcurementWorkspace
  requests={rows}
  onAutosave={(id, patch) => api.patch(`/procurement-requests/${id}`, patch)}
  onTransition={(id, command, meta) =>
    api.post(`/procurement-requests/${id}/transitions`, { command, ...meta })
  }
  onAddComment={(id, body) => api.postComments(id, body)}
/>
```

## Review

See [78-procurement-requests-review.md](./78-procurement-requests-review.md).
