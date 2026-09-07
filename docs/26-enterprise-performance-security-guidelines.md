# HAMD Enterprise Performance & Security Guidelines

**Purpose:** The measurable non-functional baseline for a reliable, secure,
accessible, enterprise-ready HAMD platform.

## 1. Performance principles

- Measure real-user and synthetic performance before optimizing.
- Optimize the critical buyer/operator task, not a vanity benchmark.
- Keep API/worker/frontend services stateless; cache derived/read data, never
  authoritative commercial or financial truth.
- Prefer structural fixes-indexes, query plans, pagination, projections,
  smaller payloads-over premature infrastructure complexity.
- Performance failures are product failures when they delay a request, quote,
  payment, tracking, or support action.

## 2. Frontend guidelines

| Area | Enterprise guideline |
| --- | --- |
| Route/code splitting | Split public, Client Workspace, Operations Console, chart/map/document/AI/celebration modules by route/feature; do not defer critical navigation/auth shells. |
| Lazy loading | Lazy-load maps, rich document preview, large galleries, chart libraries, AI, media, and low-frequency admin routes with accessible fallback. |
| Images/media | Serve responsive dimensions/formats, CDN transforms, explicit size/aspect ratio, lazy noncritical load, poster/caption; never block page on video/360 content. |
| Bundle | Enforce bundle budgets, tree-shake, remove duplicate libraries, analyze build artifacts, avoid large date/icon/editor dependencies in initial chunk. |
| Caching | Cache versioned static assets aggressively; use API cache headers/ETags for safe public/reference reads; invalidate scoped client cache on auth/org switch. |
| Rendering | Virtualize long tables/timelines/messages; memoize only measured expensive pure work; avoid stale authorization/state from over-memoization. |
| Loading | Stable skeletons for short expected loads; determinate/background task status for long work; never hide error behind indefinite shimmer. |
| SEO | Server/static-render public content where appropriate, canonical/meta/schema, fast HTML, accessible semantic content, no JS-only essential SEO. |
| Accessibility | Semantic HTML, keyboard, focus, contrast, reduced motion, ARIA only where needed; accessibility often improves performance/readability. |

Targets: p75 LCP ≤ 2.5s, INP ≤ 200ms, CLS < 0.1 on supported mobile;
performance budgets are monitored per public/client/admin route.

## 3. Backend and data guidelines

| Area | Enterprise guideline |
| --- | --- |
| Indexes | Index FKs and measured tenant queue/query paths; use composite `(organization_id,status,due_at)` style indexes, partial indexes for active/unread/open, FTS/trigram for scoped search. |
| Queries | Select only required fields, prohibit N+1, inspect query plans, set query/statement timeouts, use read projections for dashboard/reporting. |
| Prisma/PostgreSQL | Pool connections, isolate migration role, use transactions/locking/row version for balances/inventory/approval, avoid unbounded includes and raw dynamic SQL. |
| Pagination | Cursor pagination/default limits, allowlisted sort/filter/search, maximum page/export limits, async reports for large data. |
| Redis | Rate limits, safe scoped cache, idempotency, presence, queues; never sole source of session/business truth; graceful degradation. |
| Compression/streaming | Enable safe response compression; stream controlled large downloads/uploads with limits; use signed direct media upload, not API memory buffers. |
| Logging | Structured/redacted logs with trace/request IDs, latency, error code, route, safe actor/org metadata; never log secrets/PII/documents/tokens. |
| Scaling | Stateless API/worker horizontal scale, Redis Socket.IO adapter, DB pooling/read models, backpressure/queue limits, provider circuit breakers. |

Targets: authenticated read p95 ≤ 500ms, critical command acknowledgement p95
≤ 800ms excluding async work, search p95 ≤ 800ms, Socket event projection p95
≤ 2s under normal conditions.

## 4. Security baseline

### Identity and authorization

- Short-lived signed JWT access token, opaque rotating hashed refresh-token
  families, server-side revocation/session control, reuse detection.
- Argon2id password hashing, breached-password protection, verified email,
  TOTP MFA/recovery codes, step-up for payment/role/bank/export/recovery.
- OIDC+PKCE for Google/Microsoft; future OIDC/SAML/SCIM enterprise identity.
- Server-side organization/record/permission/lifecycle/SoD checks on every
  action. UI roles are never authorization.

### Web/API protection

- Strict CORS origin allowlist; never wildcard credentials.
- CSRF token/origin validation for cookie-authenticated writes; no state GET.
- Helmet/reviewed CSP, HSTS, frame-ancestor, nosniff, referrer/permissions
  policy; no inline unsafe script to accommodate content.
- Schema validation at every boundary, output encoding/sanitization, parameterized
  Prisma queries, allowlisted filters/sorts, safe structured errors.
- Layered rate limits by IP/account/session/org/device/endpoint; adaptive
  CAPTCHA after risk, not as primary defense.
- Idempotency/replay verification for payments, webhooks, imports, exports,
  emails, and external mutations.

### Data/files/infrastructure

- TLS, managed encryption at rest, KMS-scoped secrets, rotation, separate
  runtime/migration credentials, private network database access.
- Private object storage, signed URLs, MIME signature/size/duration validation,
  malware scan/quarantine, sandboxed previews, retention/legal-hold policy.
- Dependency/SAST/secret/container scans, SBOM/license review, patch SLAs,
  DAST/pentest/security reviews for high-risk releases.
- Immutable audit events for identity, access, finance, supplier bank,
  commercial, export, configuration, integration, and admin changes.

## 5. Monitoring recommendations

- **RUM:** Web Vitals by route/device/network; JS errors, interaction latency,
  asset failures.
- **APM/tracing:** API/Prisma/Redis/worker/provider/Socket.IO spans and
  correlation IDs.
- **Metrics:** p50/p95/p99 latency, error rate, saturation, connection pool,
  DB lock/query/index health, cache hit/eviction, queue depth/age, webhook
  verification, tracking freshness, notification delivery.
- **Security:** auth failures, token reuse, rate-limit/CAPTCHA events,
  permission denials, export/access anomaly, secret scan, dependency findings.
- **Synthetics:** public homepage, login sandbox, authenticated critical API,
  payment/tracking/provider health.
- **Alerts:** actionable severity/runbook/owner, deduped escalation, error
  budget and data-quality/reconciliation alerts.

Recommended stack: OpenTelemetry + Sentry; Datadog, Grafana Cloud, New Relic,
or equivalent for logs/metrics/traces; Checkly/Datadog Synthetics; CodeQL,
Gitleaks, Dependabot/Snyk, Trivy, OWASP ZAP, and independent penetration
testing.

## 6. Enterprise release gates

- Performance budget and regression check passed.
- No unresolved critical/high security finding without documented risk
  acceptance and mitigation.
- Authentication/authorization/tenant isolation/CSRF/CORS/upload/webhook tests
  passed.
- Accessibility and supported browser/mobile checks passed.
- Logs/traces/metrics/alerts/runbook, backup/restore, rollback/canary plan
  verified.
- Data migration/index/query plan and feature-flag/kill switch reviewed.

## Final quality bar

HAMD is enterprise-ready only when it is fast under realistic load, secure
under hostile input, accessible under assistive/low-resource conditions,
observable in production, and recoverable without sacrificing trustworthy
business data.
