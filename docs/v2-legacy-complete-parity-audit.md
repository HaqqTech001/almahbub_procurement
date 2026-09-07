# V2 / Legacy Complete Parity Audit

Date: 2026-08-23

## 1. Audit mandate

This audit is a pre-implementation gate. It exists to confirm what is already implemented in V2, what remains to be recovered from legacy V1, what must remain archived, and what must not be reintroduced.

The active runtime is V2. The legacy code under `backend/`, `client-frontend/`, and `admin-dashboard/` is reference-only and must not become a second production engine.

This audit is not a green-light for feature work. It is the evidence base that decides what implementations are justified and what guardrails are mandatory.

## 2. Source-of-truth architecture

### 2.1 Runtime boundary

- Active app runtime: `apps/api`, `apps/web`, `apps/ops`
- Archived references: `backend`, `client-frontend`, `admin-dashboard`
- Canonical database contracts: `database/prisma/schema.prisma`
- Canonical auth and permission model: `apps/api/src/modules/identity/auth/domain/permission-catalog.ts`
- Canonical request lifecycle: `apps/api/src/modules/procurement/domain/procurement-request-state.ts`

### 2.2 Business rule hierarchy

The system is governed by the following sequence of truth:

1. Database schema and domain models
2. Permission catalog and policy checks
3. Request state machine and workflow logic
4. V2 UI surfaces
5. Legacy V1 behavior only as a reference for missing parity

This means legacy V1 code cannot override V2 business rules. If a desired behavior is present in V1 but absent in V2, it must be implemented in V2 by mapping to the current domain model rather than by copying legacy route logic.

## 3. Executive finding

V2 is materially more complete and structurally sound than a raw “legacy clone” exercise would suggest. The real work is not “rebuild V1 in new code”; it is to close the remaining gaps where legacy behavior was not yet transported into V2 or where the UI still violates the present permissions model.

The platform is not production-complete yet, but it is no longer an empty shell. The remaining work is a controlled parity and hardening pass, not a replacement of the system.

## 4. Audit results by domain

### 4.1 Authentication and admin bootstrap

Status: partly implemented; still requires production-safe bootstrap and enforcement.

Evidence:

- `apps/api/src/modules/identity/auth/application/auth-service.ts` includes registration, email verification, login, password reset, and permission assignment.
- `apps/api/src/modules/identity/auth/domain/permission-catalog.ts` defines the authoritative permission inventory.
- `database/prisma/seed/development.ts` seeds permissions and reference data, but this is development-only data and not a production bootstrap path.

Findings:

- Buyer default permissions are intentionally narrow and controlled by the permission catalog.
- Admin/ops access is not derived from a raw `role === "admin"` pattern; it must depend on permission grants such as `ops:access` and domain permissions.
- No production bootstrap mechanism is allowed to hard-code credentials or silently create privileged access.
- Any admin user creation must come from explicit environment/personnel workflow and should be auditable.

Decision:

- Keep V2 permission-first auth model.
- Do not revive legacy admin role checks.
- Do not add hard-coded admin accounts or browser-only fallbacks.

### 4.2 User and ops authority

Status: implemented in core API and ops UI; still needs parity review across management actions.

Evidence:

- `apps/api/src/modules/procurement/application/procurement-request-service.ts` uses permission-aware assertions and ownership checks.
- `apps/ops/src/modules/UsersPage.tsx` implements directory search, status changes, and ops access toggles.

Findings:

- V2 already distinguishes buyer and ops authority based on permissions rather than a single role string.
- Ops functions must remain restricted to permission-bearing accounts, not open to any signed-in buyer.
- Legacy V1 assumptions that “admin can do everything” are not an acceptable source of truth.

Decision:

- Preserve V2 permission boundaries.
- Recover only the required operating actions that are consistent with current permissions and workflow states.

### 4.3 Procurement lifecycle

Status: strong core implementation, with missing UI exposure for some valid transitions.

Evidence:

- `apps/api/src/modules/procurement/domain/procurement-request-state.ts` defines the valid state machine.
- `apps/api/src/modules/procurement/application/procurement-request-service.ts` enforces transitions, ownership, and audit events.
- `apps/ops/src/modules/RequestsPage.tsx` shows admin request processing controls.
- `apps/web/src/procurement/ProcurementCreatePage.tsx` shows buyer request creation and draft management.

Findings:

- V1 allowed loose status changes and free-form admin updates; V2 requires a controlled state graph.
- V2 supports operations such as `request_clarification`, `accept_for_sourcing`, `start_sourcing`, `approve`, `decline`, `start_purchase`, `fulfill`, `close`, and `cancel`.
- Some legacy admin status semantics existed in V1, but they do not map cleanly to V2 domain events and must not be reintroduced as an unstructured status enum.
- The current audit confirms that the V2 workflow is more correct than V1, but some admin request detail actions remain under-exposed in the UI.

Decision:

- Do not reintroduce a “free-form status dropdown” from V1.
- Expose only valid transitions in state-aware UI buttons.
- Keep buyer-facing controls limited to their own request lifecycle actions.

### 4.4 Communications, support, and announcements

Status: implemented as a parity layer, but not all legacy semantics are intended to be restored.

Evidence:

- `apps/api/src/modules/communication/parity/application/parity-service.ts` implements announcements, knowledge articles, support threads, and public service/marketing entry points.
- `apps/api/src/modules/communication/parity/api/parity-routes.ts` exposes public and admin parity routes.

Findings:

- V1 support chat and announcements have legacy behaviors that are not all appropriate for V2.
- V2 already models announcement publishing and visibility with a controlled lifecycle.
- Some elements from V1 (replies, reactions, pinning, schedules, broad media attachment behavior) are not established as required parity imports and must not be invented without clear domain evidence.
- A compatibility layer is useful, but it should not become a duplicate announcement engine.

Decision:

- Keep announcement access behind publish and manage permissions.
- Reuse the media/document system rather than inventing a second asset layer.
- Treat only the necessary business features as parity requirements; do not restore every legacy convenience feature automatically.

### 4.5 Media and document pipeline

Status: relevant document/media infrastructure exists; need audit to confirm attachments follow V2 patterns without blob-url misuse.

Evidence:

- `apps/api/src/modules/media/document/application/document-service.ts` is the authoritative media/document service.
- `apps/api/src/modules/communication/parity/application/parity-service.ts` uses media joins and document attachment flows.
- `apps/ops/src/modules/ProductsPage.tsx` includes upload handling and media URL resolution logic.

Findings:

- The project explicitly calls out issues such as blob URL misuse and assigning ephemeral blob URLs as stored media references.
- Temporary blob URLs are not a safe persistence model and must not be treated as canonical media references.
- Document/media uploads should be stored and referenced through the canonical document service, not browser-local object URLs.

Decision:

- Keep media persistence in the canonical document layer.
- Remove or block any workflow that stores temporary browser object URLs as user-visible or persisted references.

### 4.6 Product catalog and IE / International flow

Status: V2 has a structured, domain-based product catalog and an integrated export portal, but several navigation and intent boundaries still need audit enforcement.

Evidence:

- `apps/web/src/integrated-export/pages/IeRequestPage.tsx` shows authenticated IE enquiry creation with `lob=integrated_export`.
- `database/prisma/seed/development.ts` seeds reference data and IE commodity staging.

Findings:

- The IE flow is intentionally separate from general procurement and should not collapse into a generic request experience.
- The public “Almahbub International” informational landing and the authenticated workspace are distinct contexts and must not be conflated.
- Some IE navigation labels and links were found to be ambiguous and can cause users to leave the International experience or land in the wrong portal context.

Decision:

- Keep public IE and private workspace navigation distinct.
- Avoid shortcuts that collapse work context into public marketing context.
- Preserve LOB isolation and do not merge IE into general request handling beyond the correct domain model.

### 4.7 UI quality and UX guardrails

Status: many issues are known historical defects and must be fixed in the V2 UI without reintroducing legacy behaviors.

Evidence:

- `apps/ops/src/modules/ProductsPage.tsx` contains `window.confirm` usage and old-style confirmation patterns that are explicitly disallowed for production UX.
- This project explicitly forbids browser alerts and prompt-based user confirmations in production UI.

Findings:

- Confirm dialogs are not the required way to manage production-grade UX.
- Legacy UI patterns must not be copied directly into V2.
- Empty-value placeholders and certain marketing copy should be normalized without changing legal/brand copy that is intentionally source-attributed.

Decision:

- Remove or replace blocking browser alerts with inline, non-modal status flows.
- Keep UI copy consistent with the current brand language and approved public messaging.
- Do not change source-attributed or intentionally brand-locked copy.

## 5. Legacy V1 features that are authoritative only as reference

The following V1 behaviors are useful only as reference material for parity recovery, not as direct reimplementation signals:

- Buyer request creation and file attachment patterns
- Admin request approval and rejection conventions
- Announcement creation and media handling patterns
- Support chat thread flow and unread semantics
- Buyer/admin communication expectations

These are informative but not authoritative unless they map onto current V2 domain contracts and permission policies.

## 6. Legacy features that should not be reintroduced

The following items are explicitly out of scope or disallowed:

- A second production procurement engine
- Free-form status strings replacing the V2 state machine
- Hard-coded admin credentials or hidden bootstrap accounts
- Browser alerts/confirm dialogs in the production UX
- Legacy raw `role === "admin"` checks
- Storage of temporary blob URLs as canonical media references
- Duplicate announcement engine semantics that were not already proven in V2
- Replacing public/informational IE landing with the workspace shell

## 7. Production completion readiness assessment

### 7.1 Ready to proceed

The following are in place and suitable for production completion work:

- V2 runtime separation from V1 archival code
- Permission-first identity and authorization model
- Request lifecycle state machine and transaction guards
- Document/media service boundaries
- Ops/admin directory and user access management
- Public and private portal separation

### 7.2 Still requires remediation

The following remain to be closed before production completion:

- Admin bootstrap and production-safe user provisioning
- Remaining state-aware ops controls that are valid but not exposed in the UI
- Finalized parity on announcements, support flows, and media attachments
- Corrected navigation and IA boundaries across IE/public/workspace
- Removal of blocking browser alerts and legacy UX patterns
- Explicit verification of media persistence, not blob-only references
- Final regression and validation pass against the authoritative V2 rules

## 8. Required implementation sequence

The project must proceed in this order:

1. Authentication and admin bootstrap
2. User/admin authority and permission enforcement
3. Procurement lifecycle parity and state-aware UI actions
4. Notifications and email flows
5. Messaging and support thread parity
6. Media/document upload and persistence
7. Announcements and public content parity
8. Product hierarchy and catalog consistency
9. IE request flow and navigation integrity
10. UI cleanup and approval pattern elimination
11. Final regression, audit, and launch verification

This order is mandatory because later layers rely on the authority and persistence boundaries established earlier.

## 9. Final determination

The system is not a greenfield rebuild and it is not a pure legacy port. It is a V2 operating platform with a strong domain model and a set of residual parity and production-hardening tasks. Those tasks should be resolved in V2 only, using legacy V1 as guidance where appropriate and never as an override for the current architecture.

This audit confirms the correct direction: continue in the active V2 codebase, preserve the permission-first design, recover only the missing required parity, and block all legacy shortcuts that would weaken the current system.
