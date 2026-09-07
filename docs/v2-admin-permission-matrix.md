# V2 admin permission matrix

Existing catalog only. No duplicate permission keys were added. V1 `role === 'admin'` maps to `ops:access` plus the ops role’s catalog (`DEFAULT_OPS_PERMISSIONS`).

Buyer registration still never receives `ops:access`.

| Capability | Buyer | Admin/Ops | CMS | Organization scope | Required permission | API authorization | UI location |
|---|---|---|---|---|---|---|---|
| Own account profile | Yes | Own only | No | Own user | Authenticated | `/api/v1/auth/me`, profile | Web workspace account; Ops `/account` (“My account”) |
| List users | No | Yes | No | Platform directory (existing ops identity) | `ops:access` | `GET /api/v1/ops/identity` | Ops `/users` |
| Search / filter users | No | Yes | No | Same | `ops:access` | Query `q`, `userStatus`, `status` | Ops `/users` |
| User detail + request count | No | Yes | No | Same | `ops:access` | Identity payload | Ops user drawer |
| Suspend user | No | Yes | No | Platform; not self; not last ops admin | `ops:access` | `PATCH /api/v1/ops/identity/users/:userId/status` `{ command: "suspend" }` | Ops user drawer |
| Activate user | No | Yes | No | Not from `pending_verification` | `ops:access` | `{ command: "activate" }` | Ops user drawer |
| Deactivate user | No | Yes | No | Not self; not last ops admin | `ops:access` | `{ command: "deactivate" }` | Ops user drawer |
| Grant operations access | No | Yes | No | Prefers actor org membership; not self | `ops:access` | `PATCH .../ops-access` `{ command: "grant" }` | Ops user drawer |
| Revoke operations access | No | Yes | No | Not self; not last ops admin | `ops:access` | `{ command: "revoke" }` | Ops user drawer |
| Inject `role=admin` | No | No | No | — | — | Rejected (Zod command only) | None |
| Procurement request queue | Own requests | Yes | No | Org + LOB policy | Buyer: `request:read` etc. Ops: `request:manage` | Procurement routes + command auth | Web `/app`; Ops `/requests` |
| Approve / decline / start purchase | No | Yes | No | Request auth floor | `request:manage` | Admin request commands | Ops request detail |
| Buyer submit / cancel / revision | Yes | N/A | No | Own request | `request:submit` / `request:cancel` | Customer commands | Buyer request UI |
| Quotations | Own | Manage | No | Org | Buyer `quotation:read`; ops quotation:* | Quotation routes | Web + Ops `/quotations` |
| Invoices / payments / shipments | Own read | Manage | No | Org | matching `invoice:*` `payment:*` `shipment:*` | Domain routes | Ops finance/logistics; buyer reads |
| Announcement public read | Yes (anon) | Yes | Read | Global published + live window | Public | `GET /api/v1/announcements` | Web slider + `/announcements` |
| Announcement manage (create/edit/archive/media/pin/schedule) | No | Yes | Yes | Org or platform null-org rows | `ops:access` (parity also accepts cms/communication keys via `assertParityManage`) | `/api/v1/announcements` admin routes | Ops `/cms` |
| Edit #Hamd'26 | No | No | No | — | — | Not a CMS record | `apps/web/src/content/campaigns.ts` only |
| Categories create/update | No | Yes | No | Catalog | `ops:access` | `/api/v1/ops/categories` | Ops `/categories` |
| International products CMS | No | Yes | No | Catalog | `ops:access` + `cms:manage` where used | `/api/v1/ops/products` | Ops `/products` |
| IE commodities | No | Yes | No | Isolated IE LOB | `ops:access` / IE routes | IE commodity API | Ops `/integrated-export/commodities` |
| Support chat | Own thread | Org threads | No | Organization | Buyer authenticated; ops `ops:access` / communication | `/api/v1/support/*` | Web support; Ops `/support` |
| Knowledge / AI assistant | Use `ai:use` | Manage | No | Org/platform articles | `guidance:manage` to see Ops AI nav; API uses parity manage | `/api/v1/ai/knowledge` | Ops `/ai-assistant` |
| Notifications inbox | Own | Own | No | Recipient | `notification:read` | Notification routes | Web + Ops `/notifications` |
| Audit log | No | Yes | No | Platform/org events | `audit:read` | `GET /api/v1/ops/audit-events` | Ops `/audit` |
| Dashboard | No | Yes | No | Platform KPIs | `ops:access` | `GET /api/v1/ops/dashboard` | Ops `/` |
| Organisations directory | No | Read | No | Platform list | `ops:access` | Identity payload `organizations` | Ops `/organizations` |

## Mapping notes

- V1 admin → V2 `ops_admin` role holding `DEFAULT_OPS_PERMISSIONS` (includes `ops:access`, `request:manage`, `cms:manage`, `communication:publish`, `audit:read`, …).
- V1 user → V2 `buyer` role (`DEFAULT_BUYER_PERMISSIONS`).
- V1 moderator → not mapped.
- UI hiding is not authorization. Every mutate route uses `authenticate` + `requirePermission("ops:access")` (or the domain permission for procurement/CMS).
- Suspended users fail `authenticate` because the session lookup requires `user.status = active`.
