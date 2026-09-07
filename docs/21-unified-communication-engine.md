# HAMD Unified Communication Engine

**Purpose:** A single event-driven communication domain for all platform
notifications, messages, transactional email, campaigns, and future external
collaboration channels.

## 1. Architecture principles

- Business domains publish durable events; the Communication Engine decides
  whether, how, when, and through which permitted channel to notify.
- A provider delivery attempt is not business truth. Payment, quote, shipment,
  and approval records remain authoritative in their own domains.
- Critical/security/legal notices follow policy and cannot be silently disabled.
  Marketing and non-critical communications require preference/consent.
- Templates, variable schemas, localization, attachments, priorities,
  expiration, retries, and delivery tracking are configuration/data-not code
  changes.
- Channels are adapters. In-app, email, SMS, push, WhatsApp, Slack, and Teams
  use the same canonical notification and delivery model.

## 2. Channels and appropriate use

| Channel | Primary use | Constraints |
| --- | --- | --- |
| In-app | Default authoritative actionable notification inbox and record deep links. | Requires authenticated session; persists/triages with read/saved/done state. |
| Email | Transactional detail, receipts, verification, digest, and opted-in marketing. | Deliver through Resend adapter; protect preview content and unsubscribe/consent rules. |
| SMS | Urgent, consented, short action-needed alerts. | Minimal content, regional/opt-out compliance, phone verification, rate and cost controls. |
| Push | Mobile/desktop opt-in timely alert. | Minimal payload, device token lifecycle, fall back to in-app/email. |
| WhatsApp future | Consent-based customer updates/support entry. | Template approval, regional policy, provider boundary, no sensitive unprotected content. |
| Slack future | Internal operations alerts/workflow links. | Organization/room mapping, no customer secrets in shared channels, acknowledgement is not business approval. |
| Microsoft Teams future | Internal enterprise collaboration alert/workflow links. | Tenant/admin consent, scoped channels, card data minimization, no external record leakage. |

## 3. Notification taxonomy and priority

| Type | Default priority and behavior |
| --- | --- |
| Welcome, verification, password reset | Transactional high; email/in-app; strict expiry/rate; no marketing preference dependency. |
| Procurement update, quotation ready, approval required | High/actionable; in-app plus preference-based email; deep link to record. |
| Payment confirmation, invoice due, refund/dispute | High/critical by state; finance policy and privacy-safe delivery. |
| Shipment update, delay alert, document/customer action | Normal/high based on materiality; in-app first, email/SMS/push according to consent/SLA. |
| Support | High when SLA/urgent; in-app/email and contextual room/ticket link. |
| Announcement, celebration | Normal/low; audience/frequency/quiet-hour policy; Celebration Engine owns presentation. |
| Marketing | Low; explicit consent, unsubscribe, campaign schedule, frequency cap. |
| System alert/security | Critical; mandatory channel/policy, minimal security-safe detail, acknowledgement/audit. |

Priorities: `critical`, `high`, `normal`, `low`. Priority determines
escalation, channel eligibility, quiet-hour override, expiry, retry urgency,
and inbox order-not visual color alone.

## 4. Event-to-delivery workflow

1. Domain transaction writes source event and transactional outbox record.
2. Communication worker consumes idempotently and resolves recipient, active
   organization, preferences, consent, policy, locale/time zone, and channel
   eligibility.
3. Template engine validates typed variables and renders localized channel
   content with safe link/attachment policy.
4. Delivery planner deduplicates/coalesces events, honors frequency/quiet
   hours/expiry/priority, creates canonical notification and channel delivery
   attempts.
5. Channel adapter sends/retries or schedules delivery; provider callback
   updates delivery state.
6. In-app inbox/Socket.IO receives authorized projection. User reads, saves,
   completes, or follows the deep link.
7. Analytics projector records aggregate send/delivery/open/click/read/failure/
   unsubscribe metrics; business records remain unchanged unless a separate
   formal action occurs.

## 5. Templates, localization, variables, and attachments

### Template standard

A template has stable key, notification type, channel, locale, version,
subject/title/body structured content, allowed variable schema, preview
fixtures, status, owner, approval, and effective date. Published versions are
immutable; edit creates a new version.

Templates are content, not executable HTML/script. Rendering sanitizes content,
uses channel-specific format, validates all variables, and blocks unknown/
sensitive variable insertion. Links are route/allowlist validated and include
no secret document/payment data.

### Localization

Resolve locale in order: recipient explicit preference → organization default →
surface/country fallback → English fallback. Time, currency, date, amount, and
pluralization are localized centrally. Legal/security/financial templates need
reviewed translations; missing translation may fall back to approved language
or suppress non-critical sending, never improvise legal content.

### Attachments

Attachments are references to authorized documents/media, not raw email/SMS
payloads. Email uses time-limited/signed download link or small approved
attachment under policy. SMS/push/Slack/Teams never carry sensitive files.
Delivery rechecks recipient access at render time.

## 6. Scheduling, retries, expiration, and preference policy

- Schedule by UTC instant plus recipient local delivery policy; scheduled
  messages remain subject to eligibility at send time.
- Quiet hours/digest apply to normal/low notifications. Critical/security/legal
  policy may override with audit.
- Coalesce repeated events (e.g., noncritical shipment updates) into one
  digest/summary. Never coalesce a payment, approval deadline, security event,
  or customer-required action without explicit policy.
- Each delivery has expiry. Expired verification/reset links are invalid even if
  email arrives late; expired marketing/scheduled notices are dropped.
- Retry only transient failures with bounded exponential backoff/jitter,
  channel-specific cap, dead-letter queue, and alert owner. Never retry after
  hard bounce, unsubscribe, invalid destination, or policy denial.
- “Read” is an in-app recipient action. Email open/click is approximate,
  privacy-limited, and never used as legal proof of receipt.

## 7. Database architecture

| Entity | Purpose and controls |
| --- | --- |
| `notification_events` | Canonical domain-triggered notification intent: type, source event, org, priority, record link, expiry, idempotency key. Unique source-event/type/recipient policy; append-only. |
| `notifications` | Recipient-specific in-app notification projection with state unread/read/saved/done/expired, deep link, safe summary, priority. Indexed recipient/state/created; soft close not hard delete. |
| `notification_deliveries` | One channel attempt: recipient/destination reference, template version, state, provider ID, scheduled/sent/delivered/bounced/open/click timestamps, retry count/error code. Unique notification/channel/attempt; partition-ready. |
| `notification_preferences` | User/org channel/type preference, quiet hours, digest, locale, consent/version/time. Unique recipient/scope/type/channel. |
| `communication_templates` | Template key/channel/type/locale/current version/status/owner. Unique key/channel/locale; published immutable version relation. |
| `communication_template_versions` | Renderable structured content, typed variable schema, preview, approval/audit/effective dates. Unique template/version; no hard delete published record. |
| `communication_campaigns` | Marketing/announcement campaign scheduling, audience, frequency, consent basis, status. Separate from Celebration Engine presentation campaign but can trigger it. |
| `communication_audiences` | Versioned audience selection/rule snapshot with estimated/actual count and policy. No raw unbounded query execution. |
| `communication_suppressions` | Verified email/phone/device/channel suppression, reason, source, expiry/review. Unique destination hash/channel/reason scope. |
| `device_push_tokens` | Tokenized push destination, platform, status, last seen/failed. Unique token hash; remove on provider invalidation. |
| `communication_webhook_events` | Raw-safe provider callback hash/id, provider/status/time; idempotent/append-only/partition-ready. |
| `communication_metrics` | Aggregated channel/template/type/campaign/time metrics; read model, no recipient PII. |

All sensitive destination values are encrypted/tokenized and access-controlled.
Event/delivery tables retain audit fields, tenant scope, correlation IDs, and
retention policy. Provider raw payloads are minimized/redacted.

## 8. API architecture

All routes inherit Phase 8 validation/auth/authorization/rate-limit/error/
pagination/filter/sort/search/logging/audit standards.

| Method / route | Purpose and permission |
| --- | --- |
| GET `/api/v1/notifications` | Recipient inbox with cursor filters state/type/priority/reason/record/q. |
| POST `/api/v1/notifications/read` | Batch mark read; recipient only; idempotent. |
| POST `/api/v1/notifications/{id}/save` | Save/unsave for later; recipient only. |
| POST `/api/v1/notifications/{id}/done` | Triage done; does not alter related business record. |
| GET/PATCH `/api/v1/notification-preferences` | Read/update permitted preference/quiet/digest/locale; mandatory types protected. |
| GET/POST `/api/v1/admin/communication/templates` | List/create template drafts; `communication_template:manage`. |
| GET/PATCH `/api/v1/admin/communication/templates/{id}` | View/edit/version template; structured variable/locale validation. |
| POST `/api/v1/admin/communication/templates/{id}/publish` | Approve/publish template version; separation of duties/audit. |
| GET/POST `/api/v1/admin/communication/campaigns` | Manage campaign draft/schedule/audience; `campaign:manage`; consent/expiry/frequency validation. |
| POST `/api/v1/admin/communication/campaigns/{id}/send` | Schedule/launch approved campaign; two-person policy for broad audience. |
| GET `/api/v1/admin/communication/analytics` | Aggregated delivery/template/campaign metrics with scoped filters. |
| POST `/api/v1/webhooks/communication/{provider}` | Signed Resend/SMS/push/future provider callback; raw signature/idempotency validation. |

Internal domain services publish notification intents through outbox, rather
than calling an email/SMS provider from controllers.

## 9. Permissions and security

- Senders do not directly address arbitrary recipients; domain policy resolves
  eligible recipient(s) from trusted records.
- Template/campaign authors cannot self-publish broad external communications;
  publisher approval, audience estimate, consent, link/attachment scan, and
  audit are required.
- Marketing requires explicit consent/unsubscribe/suppression compliance.
- Verification/reset/security channels use generic enumeration-safe content,
  short expiry, destination validation, and strict abuse controls.
- Encrypt destination/contact data, use provider secrets only server-side,
  verify inbound webhooks, rate-limit all trigger APIs, and redact logs.
- Notification deep links require normal authentication/authorization; a
  message preview never becomes a capability token.
- Data export/analytics show aggregates by default; raw delivery events are
  limited to auditors/communication operators.

## 10. Analytics

Measure delivery funnel by type/channel/template/locale/campaign/time:

- generated, deduplicated, suppressed, scheduled;
- attempted, accepted, delivered, bounced, complained, retried, expired;
- in-app read/saved/done, safe click/deep-link success;
- unsubscribe/consent change;
- provider latency/failure, retry/dead-letter rates;
- notification-to-action correlation only when privacy/policy allows.

Do not treat open rates as definitive human attention. Dashboard metric
definitions, freshness, retention, and access are governed through Analytics.

## 11. Frontend and user experience

- In-app inbox is searchable/triageable: unread, saved, done, critical,
  mention/assignment, record context, and notification reason.
- Toasts are limited to immediate low-friction feedback; they never replace
  persistent critical/actionable notifications.
- Preferences explain channel/type/quiet-hour effects in plain language and
distinguish mandatory security/legal alerts.
- Scheduled/campaign/template admin uses draft/review/preview/audience/
  schedule/analytics/history flows with data freshness and clear recipient
  estimate.
- Respect reduced motion, screen readers, mobile notification permission,
  offline behavior, dark mode, and privacy-safe lock-screen previews.

## 12. Future integrations

- WhatsApp Business template/consent and customer-service routing.
- Slack/Teams internal workflow alerts with scoped deep links/acknowledgement,
  never external customer data broadcast.
- Organization-owned email domain/branding, localization workflow, advanced
  digest, preference center, and provider routing/failover.
- Event orchestration for partner portals, carrier channels, and customer
  lifecycle communication.
- AI-assisted template drafting/translation subject to human approval,
  localization review, and no automatic publication.

## Final quality bar

The Communication Engine is complete only when every channel can be traced from
an authorized business event to a policy-approved, localized, secure delivery
attempt and meaningful user action-without duplicating business truth or
spamming the recipient.
