# HAMD Genesis - Enterprise API Architecture

**Stack:** Node.js, Express, PostgreSQL, Prisma, Redis, Socket.IO, Cloudinary,
Resend.  
**Scope:** Versioned production API architecture for HAMD’s public, client,
operations, integration, and real-time surfaces.  
**Constraint:** Architecture only; no implementation source code.

## 1. Architecture decisions

- Use a **modular monolith** with bounded domains, not a route-folder monolith
  or premature microservices. Extract services only when domain scale,
  availability, or team independence justifies it.
- API version base: `/api/v1`. Breaking contracts create `/api/v2`; additive
  fields are version-compatible and use explicit deprecation policy.
- Public, authenticated client, operations, webhooks, and internal worker APIs
  have distinct route groups, authentication, rate limits, and observability.
- Controllers translate HTTP to typed commands/queries. Services own business
  policy and transactions. Repositories own Prisma persistence queries.
- Socket.IO transports real-time event notifications and presence; it never
  bypasses the same authorization/state-transition service used by HTTP.
- Redis supports rate limiting, short-lived cache, idempotency/replay controls,
  presence, and job coordination. PostgreSQL remains source of truth.
- Cloudinary/media integration is mediated by the Asset/Document service; no
  client receives unrestricted upload credentials.
- Resend is mediated by a notification/email service; a successful send request
  does not mean a business action has completed.

## 2. Standard API contract

All documented endpoints inherit this standard unless explicitly marked public.

### Request and response

- JSON request/response using UTC ISO-8601 timestamps and UUID identifiers.
- Body/query/params validated by a shared schema layer before controller logic.
- Resource responses include stable `id`, timestamps, relationship references,
  status, and permitted links/actions; they never expose internal notes,
  secrets, raw provider payloads, password/token data, or unauthorized fields.
- State-changing commands accept `Idempotency-Key` where retries could cause
  duplication: payments, approvals, invites, uploads, imports, exports, quote
  issue, PO issue, and webhook-triggering commands.
- Collection responses use cursor pagination by default:
  `data`, `page.nextCursor`, `page.hasMore`, `meta.total` only when a
  count is affordable/necessary.

### Filtering, sorting, and search

- Filter syntax is explicit and allowlisted, e.g. `filter[status]=active`,
  `filter[createdFrom]`, `filter[ownerId]`.
- `sort` permits documented fields only; descending uses `-field`. Stable
  secondary order is always `id`.
- `q` performs scoped full-text/trigram search where the resource supports it.
- Cursor tokens bind filter/sort scope to prevent cursor misuse.
- List endpoints document their allowed filter/sort/search fields; unknown
  options fail with `VALIDATION_ERROR`, not silent ignore.

### Authentication, authorization, and rate limits

- Authenticated routes require valid short-lived access token and active session.
- Authorization checks active membership, organization scope, resource
  relationship, permission, lifecycle policy, separation of duties, and
  required step-up authentication.
- Public endpoints are privacy-minimized, rate-limited, and never use user
  identifiers supplied by the browser as authorization.
- Default authenticated read limit: 300 requests/minute/session, write: 60
  requests/minute/session; tune by module. Login/reset/OTP/webhooks/uploads
  use stricter dedicated policies. Limits are enforced by Redis with
  IP/account/session/device dimensions.

### Error contract

Every error returns:

- `error.code`: stable machine code;
- `error.message`: safe human description;
- `error.requestId`: correlation identifier;
- `error.fields`: field errors where validation applies;
- `error.retryable`: whether automatic retry is safe.

Common codes: `UNAUTHENTICATED`, `SESSION_REVOKED`, `FORBIDDEN`,
`STEP_UP_REQUIRED`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`,
`RATE_LIMITED`, `IDEMPOTENCY_CONFLICT`, `PRECONDITION_FAILED`,
`RESOURCE_LOCKED`, `POLICY_VIOLATION`, `EXTERNAL_SERVICE_UNAVAILABLE`,
`INTERNAL_ERROR`.

### Logging, caching, and audit

- Structured logs include request ID, trace ID, route, method, status, latency,
  authenticated actor/session/org IDs when permitted, and safe error code.
- Logs redact credentials, tokens, PII fields, bank data, raw documents, and
  provider secrets.
- Material business/security actions create audit and domain activity events.
- Redis caches public/reference reads with short TTL plus outbox-driven
  invalidation. Personalized/commercial/financial responses are not broadly
  cached. Set `Cache-Control` intentionally.

## 3. Folder and dependency structure

```text
src/
  app/                 HTTP bootstrap, route registration, dependency assembly
  config/              typed environment/configuration policy
  modules/
    <domain>/
      api/             routes, controllers, request/response schemas
      application/     commands, queries, services, authorization policies
      domain/          entities, enums, business invariants, events
      infrastructure/  Prisma repositories, provider adapters, queues
      tests/           unit, integration, contract, fixture tests
  shared/
    auth/              token/session context, permission evaluator
    database/          Prisma client, transaction helpers
    cache/             Redis client/cache/rate-limit abstractions
    events/            outbox, consumers, event contracts
    errors/            typed errors and HTTP mapper
    observability/     logs, tracing, metrics, audit writer
    validation/        schema helpers and coercion
    security/          headers, CSRF, cryptography, redaction
    storage/           Cloudinary/document interfaces
    jobs/              queue, schedules, idempotent workers
```

### Layer responsibilities

- **Routes:** endpoint registration, middleware composition, no business logic.
- **Controllers:** parse validated input, invoke application command/query,
  map response and HTTP status.
- **Services/application:** business workflow, transaction boundary,
  authorization policy, idempotency, domain event creation.
- **Repositories:** Prisma queries and persistence only; no HTTP assumptions.
- **Provider adapters:** Resend, Cloudinary, OAuth, payment, carrier, AI, and
  external APIs behind stable interfaces.
- **Utilities:** pure formatting/normalization helpers only; do not hide
  business rules in generic utility folders.

## 4. Middleware pipeline

1. Request ID, trace context, safe request logging.
2. Security headers, CORS, body/size limits, compression policy.
3. Public/auth-specific rate limiter and bot defense.
4. Authentication/session token verification where required.
5. Organization context resolution and permission/step-up precheck.
6. Request schema validation and input normalization.
7. Controller/service execution within transaction/idempotency scope.
8. Typed error mapper, response serializer, audit/domain-event dispatch.
9. Latency/metric/log finalization.

CSRF middleware applies to cookie-authenticated state changes. Multipart uploads
use a dedicated signed-upload initiation flow and are not processed through
unbounded general JSON body middleware.

## 5. Endpoint catalogue

The following is the approved initial API surface. All endpoint rows inherit
the standard contract above. “List” endpoints are paginated and document
filter/sort/search. “Command” endpoints are logged/audited and validate
idempotency where material.

### Authentication and identity

| Method / route | Purpose, auth and permission | Body/validation, response, errors, rate/cache |
| --- | --- | --- |
| POST `/auth/register` | Create pending account; public. | Email, password, locale; breach/password/email validation. Returns pending verification state. `EMAIL_IN_USE`, `RATE_LIMITED`; 5/IP/hour, never cached. |
| POST `/auth/verify-email` | Redeem verification challenge; public token. | Single-use verified token. Returns session/bootstrap state. `TOKEN_INVALID/EXPIRED`; strict limit/audit. |
| POST `/auth/login` | Password sign-in; public. | Email/password/device label; generic response for invalid credentials. Returns access/session and secure refresh transport. 10/IP/15m plus account/device limits. |
| POST `/auth/oauth/{provider}/start` | Start Google/Microsoft OIDC PKCE; public. | Provider allowlist and state/nonce. Returns authorization redirect. Strict origin validation. |
| GET `/auth/oauth/{provider}/callback` | Complete OIDC exchange; public callback. | Validates issuer/audience/state/nonce/PKCE. Returns session or linking choice. Audit/rate controls. |
| POST `/auth/refresh` | Rotate refresh family; session credential. | Refresh transport only. Returns new access token. `REFRESH_REUSE_DETECTED`; strict replay control/no cache. |
| POST `/auth/logout` | Revoke current session; authenticated. | Optional all-session scope requires step-up. Returns 204. Audit, idempotent. |
| POST `/auth/password/forgot` | Begin reset; public. | Email only; generic 202 response. 3/account/hour, 10/IP/hour; Resend job. |
| POST `/auth/password/reset` | Reset password; reset token. | Token/new password/MFA where required. Revokes sessions. `TOKEN_INVALID`; strict/audited. |
| POST `/auth/mfa/totp/enroll` | Begin authenticator enrollment; authenticated, recent auth. | Returns enrollment challenge, not secret after confirmation. `STEP_UP_REQUIRED`; no cache. |
| POST `/auth/mfa/totp/verify` | Confirm TOTP or complete MFA challenge. | Time-bound code/challenge. Returns elevated session state. Strict limit/audit. |
| POST `/auth/mfa/recovery-codes/regenerate` | Replace recovery codes; authenticated + MFA. | Reauth confirmation. Returns one-time codes. Audit/step-up. |
| GET `/auth/sessions` | View own sessions/devices. | Authenticated; returns privacy-minimized sessions. List/sort by last seen; no cache. |
| DELETE `/auth/sessions/{id}` | Revoke own session. | Authenticated owner or security admin policy. `NOT_FOUND`; audit/idempotent. |

### Users, organizations, teams, and authorization

| Method / route | Purpose, auth and permission | Body/validation, response, errors, rate/cache |
| --- | --- | --- |
| GET/PATCH `/me` | Read/update own profile/preferences. | Authenticated; validated locale/time zone/accessibility preferences. Returns profile. Write 30/min; audit preference/security fields. |
| GET `/organizations` | List memberships/select workspace. | Authenticated; returns active org summaries. Cached per session briefly. |
| POST `/organizations` | Create organization during approved onboarding. | `organization:create`; legal/country/currency validation. Returns organization/membership. Audit, idempotent. |
| GET/PATCH `/organizations/{orgId}` | Read/update organization profile. | Org member/read or `organization:update`; legal fields require admin/step-up. `FORBIDDEN`; audit. |
| GET/POST `/organizations/{orgId}/members` | List/invite members. | `membership:read/invite`; list filters status/team/role/q. Invite body email/roles/team; rate limited/audited. |
| PATCH/DELETE `/organizations/{orgId}/members/{membershipId}` | Change role/status/remove membership. | `membership:update/remove`; cannot bypass protected owner/SoD policy. `POLICY_VIOLATION`; step-up/audit. |
| GET/POST `/organizations/{orgId}/teams` | List/create teams. | `team:read/create`; name/parent validation. List cached briefly; writes audited. |
| PATCH/DELETE `/organizations/{orgId}/teams/{teamId}` | Edit/archive team. | `team:update/archive`; restrict if active scoped work remains. |
| GET/POST `/organizations/{orgId}/roles` | List/create custom roles. | `role:read/manage`; permission allowlist and scope validation. Cannot grant platform-sensitive permission. |
| PATCH `/organizations/{orgId}/roles/{roleId}` | Version/update custom role. | `role:manage`; impact review/step-up/audit. |
| GET `/permissions` | Read permission catalog. | Authenticated suitable admin; cache reference data. |

### Catalog, products, categories, suppliers

| Method / route | Purpose, auth and permission | Body/validation, response, errors, rate/cache |
| --- | --- | --- |
| GET `/products` | Catalog discovery. | Public/auth context determines visible data; filters category/brand/origin/compliance, sort relevance/name, `q`; cursor list. CDN/Redis cache public result. |
| GET `/products/{slugOrId}` | Product detail/reference attributes. | Public if published; returns safe product/media/spec data. `NOT_FOUND`; cache public detail. |
| POST/PATCH `/products[/{id}]` | Create/update curated product. | `catalog:manage`; SKU/slug/category/spec/media validation. Version/audit; `CONFLICT`. |
| GET/POST/PATCH `/categories[/{id}]` | Read/manage taxonomy. | Public read published; `catalog:manage` write; cycle/slug validation, cached read. |
| GET `/suppliers` | Search/list supplier records. | `supplier:read`; filters status/country/risk/category, q, sort; tenant-safe projection. |
| POST `/suppliers` | Create provisional supplier. | `supplier:create`; legal/country/contact validation; audit/idempotent. |
| GET/PATCH `/suppliers/{id}` | Supplier 360/read/update. | `supplier:read/update`; controlled bank/KYB fields separated. |
| POST `/suppliers/{id}/assessments` | Record KYB/risk/quality assessment. | `supplier:assess`; evidence/document and outcome validation; append-only/audit. |
| POST `/suppliers/{id}/bank-accounts` | Initiate verified bank destination. | `supplier_bank:create`; encryption/verification/step-up; no raw value in response. |
| POST `/suppliers/{id}/bank-accounts/{accountId}/approve` | Approve bank change. | `supplier_bank:approve`; SoD + step-up; audited. |

### Procurement requests, RFQs, quotations, approvals, and POs

| Method / route | Purpose, auth and permission | Body/validation, response, errors, rate/cache |
| --- | --- | --- |
| GET/POST `/procurement-requests` | List/create organization requests. | `request:read/create`; list filters status/owner/date/priority/q, sort. Create validates items/destination/budget/doc links; returns draft/submitted request. |
| GET/PATCH `/procurement-requests/{id}` | Read/update request according to state. | Relationship + `request:read/update`; optimistic row version; body cannot mutate issued commercial fields. |
| POST `/procurement-requests/{id}/submit` | Submit request for triage. | `request:submit`; validates mandatory line/target/compliance data. Idempotent/audit/event. |
| POST `/procurement-requests/{id}/assignments` | Assign procurement owner/team. | `request:assign`; validates active membership/team/SLA. Audit/notify. |
| POST `/procurement-requests/{id}/clarifications` | Request/answer structured clarification. | Participant relationship; message/field/doc validation. Creates activity/message event. |
| GET/POST `/procurement-requests/{id}/rfqs` | List/create RFQ sourcing event. | `rfq:read/create`; validates request state/items/supplier eligibility/close date. |
| GET/PATCH `/rfqs/{id}` | Read/update draft RFQ. | `rfq:read/update`; immutable after issue except controlled amendment. |
| POST `/rfqs/{id}/issue` | Invite selected suppliers. | `rfq:issue`; validates invites and approved supplier status; idempotent/email job/audit. |
| POST `/rfqs/{id}/supplier-bids` | Supplier submits versioned bid. | Scoped supplier identity/invite; validates item prices/MOQ/terms/expiry. `RFQ_CLOSED`; no broad cache. |
| GET/POST `/procurement-requests/{id}/quotations` | List/create draft quote. | `quote:read/create`; request state, option/item/cost/FX/compliance validation. |
| GET `/quotations/{id}` | Quote detail/version comparison. | `quote:read`; response projection differs for buyer/internal user. |
| POST `/quotations/{id}/issue` | Issue immutable quote version to buyer. | `quote:issue`; approval, validity, cost-source, policy validation; idempotent/audit/notify. |
| POST `/quotations/{id}/accept` | Buyer accepts quote. | `quote:accept` + approval policy; validates expiry/organization/row version. `APPROVAL_REQUIRED`; step-up if policy. |
| POST `/quotations/{id}/revision-requests` | Buyer requests revision. | `quote:read`; reason/body validated; creates controlled revision workflow. |
| GET/POST `/approval-requests` | List/create policy-driven approval instance. | Read scoped; create internal service/privileged command only. Filters subject/status/approver/due. |
| POST `/approval-requests/{id}/decisions` | Approve/reject/delegate. | Assigned approver; validates state/SoD/delegation/comment; idempotent/audit/notify. |
| GET/POST `/purchase-orders` | List/create PO from accepted quote. | `po:read/create`; creation validates accepted quote/supplier/policy. |
| GET `/purchase-orders/{id}` | PO detail/fulfillment/changes. | `po:read`; scoped projection. |
| POST `/purchase-orders/{id}/issue` | Issue immutable PO to supplier. | `po:issue`; validates terms, supplier eligibility, approval; idempotent/audit. |
| POST `/purchase-orders/{id}/changes` | Propose controlled change order. | `po:change`; line/financial/delivery delta validation; approval workflow. |

### Invoices, payments, shipments, tracking, documents

| Method / route | Purpose, auth and permission | Body/validation, response, errors, rate/cache |
| --- | --- | --- |
| GET/POST `/invoices` | List/create controlled invoice. | `invoice:read/create`; list filters status/due/type/org/q; creation validates issuer/entity/lines/tax/PO. |
| GET `/invoices/{id}` | Invoice/allocations/documents detail. | `invoice:read`; financial projection by role. |
| POST `/invoices/{id}/issue` | Issue immutable invoice. | `invoice:issue`; legal numbering/tax/document validation; audit. |
| GET `/payments` | List payments/reconciliation state. | `payment:read`; filters direction/status/date/invoice/q; finance/tenant scope. |
| POST `/payment-requests` | Initiate buyer payment request/provider handoff. | `payment:request`; validates approved invoice/amount/currency/beneficiary; idempotency/strict rate/audit. |
| POST `/payments/{id}/confirm` | Confirm reconciled payment. | `payment:confirm`; finance permission/SoD/provider evidence/step-up; idempotent/audit. |
| POST `/payments/{id}/refunds` | Request/refund payment. | `payment:refund`; policy/amount/allocation/step-up validation; audit. |
| POST `/webhooks/payments/{provider}` | Receive provider events. | Signed provider authentication; schema/idempotency/replay validation; very strict rate, raw-body verification, audit. |
| GET/POST `/shipments` | List/create shipment plan. | `shipment:read/create`; list filters status/mode/corridor/ETA/exception/q. Create validates PO/corridor/Incoterm/partner. |
| GET/PATCH `/shipments/{id}` | Shipment detail/plan updates. | `shipment:read/update`; no unauthorized commercial mutation. |
| POST `/shipments/{id}/milestones` | Record normalized milestone. | `tracking:update`; validates source/time/type/location/confidence; append-only/audit/notify. |
| POST `/shipments/{id}/exceptions` | Open/update owned exception. | `shipment:exception`; severity/owner/impact/next action/due validation. |
| GET `/tracking/{publicToken}` | Privacy-minimized public tracker. | Public opaque token; returns safe milestone/ETA only; no PII/docs/value. Strict anti-enumeration rate/no cache leak. |
| POST `/uploads/initiate` | Create scoped direct-upload intent. | Auth + relevant document permission; MIME/size/type/record validation; signed temporary upload. |
| POST `/uploads/{id}/complete` | Confirm upload for scan/processing. | Upload owner; checksum/key validation; returns processing state. |
| GET `/documents` | List authorized documents. | `document:read`; filters type/status/record/expiry/q, cursor. |
| GET `/documents/{id}` | Retrieve metadata/authorized signed view URL. | Document relationship/permission check; short cache/no shared cache. |
| POST `/documents/{id}/links` | Attach document to business record. | `document:link`; entity/type/lifecycle validation; audit. |

### Chat, notifications, AI, support

| Method / route | Purpose, auth and permission | Body/validation, response, errors, rate/cache |
| --- | --- | --- |
| GET/POST `/chat-rooms` | List/create record-scoped room. | `chat:read/create`; validates related record participant policy. |
| GET `/chat-rooms/{id}/messages` | Cursor-paginated message history. | Participant permission; filters before/after/type/q as policy permits; no shared cache. |
| POST `/chat-rooms/{id}/messages` | Send message/structured form/attachment link. | Participant permission; content/visibility/attachment validation, rate limit, moderation/audit. |
| POST `/chat-rooms/{id}/read-state` | Update read position. | Participant only; idempotent, low-priority event. |
| GET `/notifications` | Paginated user notification inbox. | Authenticated recipient; filters unread/type/priority; cursor/sort. |
| POST `/notifications/read` | Mark notifications read. | Recipient only; ID batch max validation/idempotent. |
| PATCH `/notification-preferences` | Update permitted channel preferences. | Authenticated; required legal/security channels cannot be disabled. |
| POST `/ai/conversations` | Create scoped AI conversation. | `ai:use`; purpose/context/consent validation; rate/quota/audit. |
| POST `/ai/conversations/{id}/messages` | Request AI answer/action draft. | Participant scope; retrieval authorization, prompt-size/tool policy; returns cited response/job state. |
| POST `/ai/messages/{id}/feedback` | Correct/rate AI response. | Conversation participant; minimal feedback/PII validation. |
| GET/POST `/support-tickets` | List/create support ticket. | `support:read/create`; filters status/priority/SLA/q. Create validates category/record/link/description. |
| GET/PATCH `/support-tickets/{id}` | Read/update ticket state. | Participant/support role and lifecycle policy. |
| POST `/support-tickets/{id}/events` | Add reply/status/assignment/attachment event. | Scoped role; type/content validation; audit/SLA update. |

### CMS, celebrations, reports, analytics, and admin

| Method / route | Purpose, auth and permission | Body/validation, response, errors, rate/cache |
| --- | --- | --- |
| GET `/content/pages/{path}` | Read published public CMS page. | Public; locale/path validation; CDN cache with invalidation. |
| GET/POST `/admin/cms/pages` | List/create CMS page draft. | `cms:read/create`; filters status/locale/q. Structured content/SEO validation. |
| GET/PATCH `/admin/cms/pages/{id}` | Edit/version CMS page. | `cms:update`; optimistic concurrency, structured rich-text/media validation/audit. |
| POST `/admin/cms/pages/{id}/publish` | Publish approved page version. | `cms:publish`; review/SEO/link validation, cache purge/audit. |
| GET/POST `/admin/celebrations` | List/create campaign drafts. | `celebration:read/create`; schedule/audience/theme/media/frequency validation. |
| GET/PATCH `/admin/celebrations/{id}` | Read/edit campaign/version. | `celebration:update`; published update creates new version. |
| POST `/admin/celebrations/{id}/approve` | Approve/schedule/pause/cancel command. | `celebration:publish`; SoD/step-up/priority/conflict validation; audit/cache invalidation. |
| GET `/celebration-delivery` | Resolve one eligible safe campaign. | Public/auth context trusted server-side; strict caching/rate/privacy policy. |
| POST `/celebration-delivery/{token}/events` | Record display/dismiss/CTA/failure. | Opaque delivery token; event enum/idempotency/rate validation. |
| GET/POST `/reports` | List/create saved report definition. | `report:read/create`; scopes/filter schema/export policy validation. |
| POST `/reports/{id}/runs` | Start asynchronous report run. | `report:run`; permission/time range/row limit validation; queue/audit/rate. |
| GET `/report-runs/{id}` | Read job status/signed result. | Owner/scoped auditor; result expiry/authorization. |
| GET `/analytics/{dashboard}` | Read governed dashboard metric set. | `analytics:read`; allowlisted dashboard/filter/time range; cache read models. |
| GET `/admin/audit-events` | Search immutable audit ledger. | `audit:read`; strict filter/export policy, cursor, no broad text payload exposure. |
| POST `/admin/feature-flags` | Create/update controlled flag. | `feature_flag:manage`; targeting/expiry/risk validation, step-up/audit. |
| POST `/admin/integrations/{provider}/connections` | Configure provider connection. | `integration:manage`; secret handling, callback allowlist, step-up/audit. |

## 6. Socket.IO architecture

### Connection

Socket handshake validates access token/session, user, organization membership,
origin, and rate policy. It joins only authorized rooms: `user:{id}`,
`organization:{id}`, and record rooms after an explicit relationship check.
Never trust a client-selected room name.

### Event families

- `notification.created`, `notification.updated`
- `chat.message.created`, `chat.read_state.updated`, `chat.typing`
- `request.updated`, `quote.issued`, `approval.required`
- `payment.updated`, `shipment.milestone.recorded`,
  `shipment.exception.opened`
- `support.ticket.updated`, `celebration.config.updated`

Events contain minimal authorized projection and record version/event ID. The
client refetches authoritative detail when required. Socket events are not an
alternative write API for financial/commercial changes.

### Realtime controls

Rate-limit client emits, validate payloads, prevent presence disclosure outside
permitted rooms, expire idle connections, log connection/security events, and
apply backpressure/reconnect semantics. Messages and commands still flow
through the same application service/persistence/audit path.

## 7. Redis, jobs, external adapters, and caching

### Redis use cases

- rate-limit counters and adaptive abuse signals;
- access/session denylist/revocation acceleration, never sole session truth;
- short-lived reference/public response cache;
- presence/typing with expiry;
- idempotency response/replay lock;
- distributed job/scheduler coordination only with durable Postgres job/outbox
record as source of truth.

### Jobs and outbox

Use transactional outbox events for Resend notifications, cache invalidation,
analytics projection, search indexing, document processing, carrier polling,
report generation, celebration scheduling, and webhooks. Workers are
idempotent, observable, retry with bounded exponential backoff, and use
dead-letter queues with owner/runbook.

### Provider boundaries

- **Cloudinary:** signed upload intent, scan/process status, asset metadata,
  responsive transformation policy, private/signed delivery.
- **Resend:** template/version service, consent/preference enforcement,
  delivery/bounce webhook processing, no provider request treated as read/seen.
- **AI provider:** tenant-scoped retrieval, citation/approval policy, prompt/
  tool audit, provider outage fallback.
- **Payments/carriers:** signed webhook verification, raw event persistence
  hash, provider idempotency, reconciliation/normalization adapter.

## 8. Error handling, testing, observability, and documentation

### Error handling

Typed domain errors map centrally to HTTP status and safe error contract.
Controllers do not expose Prisma/provider stack traces. Expected business
conflicts are modeled (`QUOTE_EXPIRED`, `APPROVAL_ALREADY_DECIDED`,
`PAYMENT_ALREADY_ALLOCATED`, `SHIPMENT_STATE_INVALID`) rather than emitted as
generic 500 responses.

### Testing

- Unit tests: domain invariants, authorization policies, validation, pure
  mapping.
- Repository/integration tests: Prisma transactions, unique/foreign-key/
  concurrency constraints, RLS if adopted.
- API contract tests: every endpoint status, error body, pagination/filter/
  search/sort, auth/permission, idempotency, and redaction behavior.
- End-to-end tests: registration to request, quote, approval, payment,
  shipment, document, support, and celebration delivery flows.
- Security tests: CSRF/CORS, tenant escape, role escalation, token replay,
  webhook signature, upload/content injection, rate limiting.
- Load/chaos tests: public catalog/tracking, notification fan-out, reporting,
  carrier/payment provider failures, Redis outage behavior.

### Observability

OpenTelemetry-compatible traces connect HTTP, Prisma query, Redis, Socket.IO,
job, provider, and outbox operations through correlation IDs. Publish SLOs for
API latency/error rate, job lag/failure, queue depth, provider webhook delay,
cache health, database connection/lock health, and realtime delivery.

### API documentation

OpenAPI 3.1 is generated/maintained from the request/response schemas and
published internally first. Every endpoint documents permission, body/query,
success/error responses, pagination/filter/sort/search, rate category,
idempotency, lifecycle effects, audit effects, and deprecation history.
External developer APIs receive a separate portal, sandbox, scopes, changelog,
and version lifecycle; they are not exposed by accident from internal routes.

## 9. Production release criteria

An API module is production-ready only when its route is versioned, documented,
validated, authenticated/authorized, rate-limited, observable, tested for
tenant isolation and failure, audit-aware where material, and conforms to
pagination/filter/search/sort/cache/error standards. A controller that merely
maps HTTP to raw database CRUD is not an enterprise API.
