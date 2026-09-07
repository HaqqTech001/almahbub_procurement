# Database Migration Plan (Version 1 → Version 2)

**Status:** Planning document only. Phase RC2 does **not** execute data migration.

## Engines

| | Version 1 | Version 2 |
| --- | --- | --- |
| Engine | MySQL | PostgreSQL |
| Typical host | Railway (`*.proxy.rlwy.net`) | Supabase pooler (`*.pooler.supabase.com`) |
| Access | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `SHADOW_DATABASE_URL` |
| ORM / access | Hand-written SQL via `mysql2` | Prisma (`database/prisma`) |
| Schema source | `backend/config/database.js` + `backend/migrations/*.sql` | `database/prisma/schema.prisma` + ordered migrations |

Local Docker Postgres (`docker compose`) is Version 2 **development infrastructure** and is not the Version 1 database.

## Legacy Railway MySQL schema (tables)

Created/maintained by Version 1 bootstrap:

| Table | Role |
| --- | --- |
| `migrations` | SQL migration ledger |
| `users` | Accounts (buyer + admin via role) |
| `categories` | Catalog taxonomy |
| `products` | Catalog items |
| `services` | Service catalog (route-backed; verify in live DB) |
| `orders` | Procurement requests / orders (dual API surface) |
| `order_tracking` | Shipment-like tracking rows |
| `chat_messages` | Messaging |
| `announcements` | CMS posts |
| `announcement_replies` | Thread replies |
| `announcement_views` | View events |
| `announcement_reactions` | Reactions |
| `faqs` | FAQ content |
| `notifications` | In-app notifications |
| `ai_knowledge` | AI assistant knowledge |

Treat the live Railway database as the authoritative V1 snapshot when export begins.

## Supabase PostgreSQL schema (Version 2)

Prisma currently defines **60 models**, including (grouped):

- **Identity:** User, UserCredential, UserIdentityProvider, UserSession, Device, LoginEvent, EmailVerificationToken, PasswordResetToken, UserMfaTotp, UserRecoveryCode, OrganizationInvitation  
- **Org / RBAC:** Organization, OrganizationMembership, Role, Permission, RolePermission, MembershipRole  
- **Catalog:** ProductCategory, Product, Brand, Manufacturer, ProductImage, ProductDownload, ProductVariant, Supplier, SupplierContact  
- **Procurement:** ProcurementRequest, ProcurementRequestItem, ProcurementRequestAssignment, ProcurementRequestStatusEvent, PurchaseOrder, PurchaseOrderItem  
- **Commercial / finance:** Quotation*, Invoice*, Payment*  
- **Logistics:** Shipment*  
- **Communication:** Notification*, CommunicationTemplate*  
- **Platform:** AuditEvent, OutboxEvent, EventConsumerInbox, DeadLetterEvent, NotificationEvent  

See `database/prisma/schema.prisma` and `database/prisma/migrations/` (13+ timestamped migrations).

## Table mappings (logical)

| V1 MySQL | V2 PostgreSQL (primary) | Notes |
| --- | --- | --- |
| `users` | `User` + `UserCredential` (+ sessions/MFA tables) | Split auth secrets from profile; map role → memberships/roles |
| `categories` | `ProductCategory` | Hierarchy fields may differ |
| `products` | `Product` (+ Brand, Manufacturer, images, variants) | Normalize media into child tables |
| `services` | TBD (`Product` subtype or separate) | Product decision required before ETL |
| `orders` | `ProcurementRequest` + `ProcurementRequestItem` | Stop dual request/order naming |
| `order_tracking` | `Shipment` + milestones/containers/history | Enrich during migrate or re-enter |
| `notifications` | `Notification` + `NotificationDelivery` | Channel/delivery split |
| `announcements*` | Future CMS models (not fully API-exposed) | May remain export-only until CMS ships |
| `chat_messages` | Future collaboration store | Do not force into procurement tables |
| `faqs` | Future CMS | |
| `ai_knowledge` | Future AI store | |
| - | `Quotation*`, `Invoice*`, `Payment*`, `PurchaseOrder*` | No V1 source; empty or seed-only |
| - | Outbox / audit / RBAC tables | Platform-native; not ETL from V1 |

## Migration strategy (when approved)

1. **Freeze Version 1 writes** (maintenance window) or run dual-write bridge (not preferred for RC2).  
2. **Checkpoint:** Railway backup + Supabase PITR enabled.  
3. **Expand-only Prisma migrations** already applied to target Supabase project.  
4. **Extract** MySQL dump / selective CSV-JSON export of mapped tables.  
5. **Transform** IDs to UUIDs where required; map enums to Prisma enums; hash/password strategy must preserve login or force reset.  
6. **Load** into Supabase via controlled scripts (not ad-hoc Prisma seed for production data).  
7. **Validate** row counts, referential integrity, spot-check auth and open procurement requests.  
8. **Cut over** API DNS/clients to `apps/api` only after host apps exist.  
9. **Keep Version 1 DB read-only** for a soak period before decommission.

Recommended order of domains: identity → organizations/RBAC → catalog → procurement requests → tracking/shipments → notifications → CMS/chat/AI (or defer).

## Rollback strategy

| Stage | Rollback |
| --- | --- |
| Before cutover | Discard failed load project; restore Supabase from PITR; Version 1 remains system of record |
| After API cutover, before UI cutover | Point `apps/api` back to prior release; restore DB if destructive migration applied |
| After full UI cutover | Re-enable Version 1 frontends + backend against Railway read/write backup; communicate known data divergence |
| Destructive mistake | Prefer **forward repair** migration on Postgres; avoid silent MySQL↔Postgres re-sync without audit |

Prisma does not generate down migrations. Application rollback = prior compatible image + forward schema repair.

## Non-goals for Phase RC2 archival

- No live ETL execution  
- No deletion of Railway data  
- No change to Version 1 runtime connection settings as part of this documentation task  

## References

- `database/README.md`  
- `docs/12-enterprise-database-architecture.md`  
- [`04-api-inventory.md`](./04-api-inventory.md)  
- [`legacy/README.md`](../../legacy/README.md)
