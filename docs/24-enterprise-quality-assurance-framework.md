# HAMD Genesis - Enterprise Quality Assurance Framework

**Purpose:** Production-quality QA handbook for HAMD’s public site, Client
Workspace, Operations Console, APIs, data, real-time collaboration, AI, and
integrations.

## 1. QA philosophy

HAMD quality is not “tests pass.” It is evidence that the right behavior is
reliable, secure, accessible, observable, performant, recoverable, and
maintainable under realistic conditions.

The framework adopts proven industry principles:

- shift quality/security/accessibility left into requirements and design;
- use fast layered automation, with end-to-end tests reserved for critical
cross-boundary journeys;
- treat production observability, error budgets, canaries, and rollback as QA;
- test permissions, failure/recovery, and data integrity as seriously as happy
paths;
- use risk-based depth: payment, approval, supplier, audit, identity, and
tracking evidence have higher assurance requirements than low-risk UI copy.

## 2. Test pyramid and tool strategy

| Level | Purpose | Recommended tooling |
| --- | --- | --- |
| Unit | Domain rules, validation, transformations, policies, utilities. | Vitest as default; Jest only for compatible legacy/tooling needs. |
| Component | UI states/interactions/accessibility at component level. | Vitest + Testing Library; axe integration. |
| Integration | Prisma/PostgreSQL, Redis, queues, provider adapters, transactions. | Vitest/Jest with ephemeral services/test containers. |
| API/contract | HTTP status/errors/auth/permission/schema/idempotency/pagination. | Supertest; OpenAPI schema validation; Postman collections for partner/manual contract use. |
| E2E/UI | Critical buyer/admin journeys across real browser/app boundaries. | Playwright, seeded isolated environment, visual/trace artifacts. |
| Accessibility | Automated baseline plus manual keyboard/screen-reader/zoom/reduced-motion. | axe-core/Playwright, manual NVDA/VoiceOver/keyboard matrix. |
| Security | AuthZ, tenant isolation, CSRF/CORS, injection, abuse, secrets, dependency. | SAST/DAST/dependency/secret scan, security test suites, external pentest. |
| Performance | Client Web Vitals, API latency, database/query, queue, realtime. | Playwright performance assertions, k6/artillery, APM/RUM, load/stress tests. |
| Compatibility | Supported browsers, devices, responsive states, assistive technology. | Playwright browser projects/device emulation plus selected physical device checks. |

## 3. Standard module test contract

Every module requires documented:

1. acceptance criteria and measurable expected result;
2. happy path;
3. negative/abuse cases;
4. edge cases/concurrency/time zone/localization/slow network;
5. validation rules and error contract;
6. permission/tenant/separation-of-duties tests;
7. performance benchmark and load class;
8. accessibility requirements;
9. error recovery/rollback/retry behavior;
10. logs/traces/metrics/audit expectations.

No feature is “done” because its UI looks correct in one browser or because
only the happy path works.

## 4. Domain quality matrix

| Domain | Critical acceptance, negative/edge cases, permissions, recovery/observability |
| --- | --- |
| Authentication | Register/verify/login/OIDC/MFA/reset/session rotation works; invalid/expired/reused tokens, credential stuffing, enumeration, CSRF/CORS, device revoke, SSO mapping, recovery tested; logs/audits have request/session/risk IDs and redact secrets. |
| Products/catalog | Search/spec/facet/compare/request handoff preserve evidence; malformed specs, missing media, stale certificate, incompatible comparison, policy restricted/blocked product, localized units tested; catalog read latency/facet accuracy and accessibility verified. |
| Procurement | Draft/submit/clarify/assign/state timeline is valid; invalid transition, duplicate submit, concurrent edit, bad item quantity, cross-org access, offline draft recovery tested; SLA/audit/outbox logs present. |
| Quotations/approvals | Versioned quote compares costs/terms, issue/accept/revise policy works; expired quote, altered issued version, unauthorized approver, duplicate decision, SoD conflict, currency/rounding tested; no animated/ambiguous money state. |
| Invoices/payments | Issued documents/allocations/reconciliation are exact; webhook replay, partial payment, over-allocation, provider failure, refund/dispute, unauthorized financial read, step-up/SoD tested; immutable audit/reconciliation trace required. |
| Tracking | Timeline source/time/ETA/exception/POD works; out-of-order carrier event, stale event, correction, quantity mismatch, public-token enumeration, map failure, delay notification tested; timeline remains accessible truth. |
| Chat/collaboration | Room/visibility/message/attachment/read/mention/search rules work; internal-note leak, unauthorized Socket room, attachment malware/type, duplicate send, reconnect order, translation/AI hidden content tested. |
| Notifications | Event→policy→template→delivery→inbox works; dedupe, expiry, opt-out, mandatory security notice, provider bounce/retry, wrong-recipient, preference race tested; delivery is not business truth. |
| Celebration Engine | Audience/time/priority/frequency/preview/approval/kill switch work; expired/paused/campaign conflict, reduced motion, critical-workflow suppression, unsafe asset/link, analytics privacy tested. |
| CMS | Draft/review/preview/publish/rollback/localization/SEO/media works; XSS/script, bad redirect, missing alt/caption, unauthorized preview, schedule race, cache purge failure, revision conflict tested. |
| Analytics | Metric formula/lineage/freshness/drill-down/export works; time/currency mismatch, stale projection, unauthorized aggregate leak, export row limit, report failure/retry tested; reconciliation alert required. |
| AI | Authorized cited task works with confidence/escalation; prompt injection, tenant/document leak, hallucinated source, unsafe tool call, provider timeout, quota, malformed output, feedback privacy tested. |
| Admin/Operations | Role workspace/queues/actions/audit work; hidden-action UI, mass mutation, stale saved view, MFA/SoD bypass, unsafe export, concurrent state change tested. |
| Client/Public | Core journeys work on supported device/network/browser; zero/failed content, public tracker privacy, SEO/canonical, form retry, accessibility/mobile/RUM Web Vitals tested. |

## 5. Performance benchmarks

Benchmarks are SLO targets validated against realistic traffic/data, then
monitored in production:

- Core client/public pages: LCP ≤ 2.5s at p75 supported mobile network; CLS <
  0.1; INP ≤ 200ms target.
- Authenticated record/list API: p95 ≤ 500ms excluding expected async work.
- Critical write command acknowledgement: p95 ≤ 800ms with background side
  effects via outbox; no double effects on retry.
- Search/filter: p95 ≤ 800ms at intended indexed scale.
- Tracking header/timeline projection: p95 ≤ 700ms without map/media.
- Socket event delivery: p95 ≤ 2s from committed event to authorized client
  projection under normal service conditions.
- Report/export: asynchronous, progress/status available; no request thread
  held for large data.

Load tests validate normal, peak, and stress/breaking behavior; resilience
tests validate Redis/provider/database queue degradation and recovery.

## 6. Accessibility and browser matrix

- WCAG 2.2 AA automated checks on all routes/components plus manual keyboard,
  screen reader, 200% zoom/reflow, contrast, reduced motion, and touch target
  testing.
- Supported browsers: current and previous stable Chrome, Edge, Firefox,
  Safari; iOS Safari and Android Chrome for mobile flows.
- Test desktop/laptop/tablet/mobile and slow-network/offline behavior for
  client/public key journeys. Browser/device exceptions are documented, owned,
  and time-bounded.

## 7. CI/CD quality pipeline

1. Pre-commit/PR: format, type, lint, unit/component, secret/dependency scan.
2. PR required: integration/API contract, targeted Playwright, accessibility,
   database migration validation, visual regression for approved critical UI.
3. Main/staging: full E2E critical journeys, OpenAPI validation/Postman suite,
   performance smoke, DAST baseline, provider sandbox/webhook tests.
4. Pre-production: load/stress/resilience/security review for affected
   high-risk domains, migration backup/restore rehearsal, release checklist.
5. Deployment: canary/feature flag, synthetic checks, RUM/APM/error/queue/
   webhook dashboards, rollback readiness.
6. Post-release: alert review, metric reconciliation, defect triage, incident/
   learning loop.

No test suite is skipped without explicit documented risk acceptance by product,
engineering, QA, and security owners.

## 8. Bug severity matrix

| Severity | Definition | Release response |
| --- | --- | --- |
| S0 critical | Data breach/loss, payment/authorization defect, widespread outage, irreversible commercial integrity failure. | Stop release/mitigate immediately, incident process, executive/security notification. |
| S1 high | Core journey blocked, material incorrect data, serious accessibility/security/performance issue, no safe workaround. | Fix before release or formally block; expedited owner/SLA. |
| S2 medium | Important function degraded with safe workaround, localized incorrect UI/logic, accessible alternative exists. | Prioritize current/next planned release with owner. |
| S3 low | Cosmetic/nonblocking issue, wording/minor layout with no accessibility or trust impact. | Backlog with triage; do not ignore recurring design debt. |

## 9. Definition of Done

A feature is done only when:

- acceptance criteria and domain test contract are approved;
- implementation is reviewed and has no unresolved S0/S1 issues;
- unit/integration/API/E2E test depth matches risk;
- permissions, validation, audit, error/recovery, idempotency, and observability
  are tested;
- accessibility/responsive/reduced-motion/loading/empty/error/success/offline
  states are verified;
- performance benchmark and production monitoring are defined;
- documentation/OpenAPI/runbook/migration/feature flag are updated where
  applicable;
- product, QA, security, and operations sign-off is recorded for high-risk
  releases.

## 10. Release checklist

- [ ] Scope, owners, risk classification, acceptance criteria, rollback plan.
- [ ] Database migration/backup/restore/reconciliation reviewed.
- [ ] API/OpenAPI/versioning/authz/rate/idempotency/error contract validated.
- [ ] Test suites passed with artifacts; new test coverage is meaningful.
- [ ] Accessibility/browser/mobile/performance/security gates passed.
- [ ] Logging, tracing, metrics, dashboards, alerts, runbook, on-call owner.
- [ ] Feature flag/canary/kill switch and communication/support plan ready.
- [ ] No unresolved S0/S1; S2/S3 risk accepted with owner/date.

## Final quality bar

HAMD is release-ready only when it behaves correctly under valid use, invalid
use, partial failure, concurrent use, degraded network/provider conditions, and
real authorization boundaries-and when the team can detect, diagnose, recover,
and learn from failures in production.
