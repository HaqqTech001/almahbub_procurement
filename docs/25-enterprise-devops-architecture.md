# HAMD Genesis - Enterprise DevOps and Deployment Architecture

**Stack:** React, Node.js/Express, PostgreSQL/Prisma, Redis, Socket.IO,
Cloudinary, Resend, Docker, GitHub Actions, Render.

## 1. Deployment principles

- Build once, promote the same immutable artifact through environments.
- Infrastructure configuration, schema migrations, secrets, health, rollout,
  rollback, and recovery are first-class release concerns.
- Runtime services are stateless; PostgreSQL/object storage are authoritative
  durable stores; Redis is disposable acceleration/co-ordination state.
- Production access is least privilege, audited, MFA-protected, and never
  depends on developer laptops or shared credentials.
- Render is the initial deployment target, not an architectural dependency.
  Containers, environment contracts, OpenTelemetry, health endpoints, and
  externalized state preserve future portability.

## 2. Environment strategy

| Environment | Purpose and controls |
| --- | --- |
| Local | Developer Docker Compose services, synthetic data, isolated `.env` values, no production secrets/data. |
| CI | Ephemeral test services, reproducible lockfiles, no persistent sensitive output. |
| Preview | Per-PR optional frontend/API preview using synthetic/isolated data; never production database or webhooks. |
| Staging | Production-like topology, sandbox providers, migration rehearsal, E2E/security/performance smoke, controlled test data. |
| Production | Separate Render services/datastores, least-privilege secrets, real monitoring/backups, change control, no direct schema changes. |

## 3. Local development setup

Local setup provides React public/client/operations apps, API, PostgreSQL,
Redis, mock/sandbox email/storage/provider adapters, and optional Socket.IO.
Use pinned Node/package-manager versions, containerized dependencies, seeded
fictional data, documented commands, and a one-command health check.

Developers use local secrets only, never copy `.env` from production. Cloudinary,
Resend, payment, OAuth, carrier, and AI integrations use sandbox/test accounts
and callback tunnels limited to local development. Test reset/seed scripts
destroy only named local/test databases with explicit guardrails.

## 4. Docker and container strategy

### Images

- Build separate minimal production images for API and each frontend delivery
  surface where deployment topology requires it.
- Use multi-stage builds: dependency resolution, build/test, minimal runtime.
- Pin base image digest/version, run as non-root, set read-only filesystem
  where practical, expose only required port, use `.dockerignore`, and include
  no credentials/source-map secrets.
- Runtime image contains production dependencies only; static frontend assets
  use CDN/optimized web serving.

### Service topology

1. **Frontend delivery:** static React assets/CDN or Render static sites.
2. **API service:** Express REST, authenticated Socket.IO handshake, health/
   readiness, no local durable upload/session state.
3. **Worker service:** outbox, notification, report, document, indexing,
   scheduled jobs; scales independently from API.
4. **PostgreSQL:** managed production database with private networking,
   backups/PITR, connection pooling, migration role separation.
5. **Redis:** managed service for rate limits/cache/presence/job coordination;
   data loss must not corrupt business truth.
6. **External services:** Cloudinary, Resend, OAuth/SSO, payment/carrier/AI
   adapters behind environment-configured interfaces.

Socket.IO horizontally scales only with a Redis adapter and sticky/session
strategy supported by deployment platform. HTTP and workers remain stateless.

## 5. Configuration and secrets

### Environment variable policy

Typed startup validation is mandatory; API refuses to start if required secure
configuration is absent or unsafe. Variables are grouped:

- service/environment identity, public base URLs, trusted CORS origins;
- database/Redis URLs and pool limits;
- JWT issuer/audience/key reference, session/cookie/CSRF policy;
- OAuth provider client IDs/secrets/redirects;
- Cloudinary/Resend/provider credentials and webhook signing secrets;
- observability DSN/endpoints/sampling, feature flags, rate-limit policy;
- storage/retention/region configuration.

Never commit `.env`, place secrets in Docker images/frontend bundles/logs, or
reuse secrets across environments. Frontend variables contain only explicitly
public values.

### Secrets management

Use Render encrypted environment secrets initially, repository environment
secrets with GitHub Actions environment protection, and a managed KMS/secret
manager as scale/compliance requires. Rotate provider, database, JWT signing,
webhook, and OAuth secrets on schedule and after incident. Runtime and
migration credentials are separate; CI receives scoped short-lived credentials
where possible.

## 6. CI/CD pipeline

### Pull request

1. dependency/install lockfile validation;
2. formatting, lint, TypeScript, unit/component tests;
3. SAST, secret scan, dependency/license scan;
4. build containers and container vulnerability scan;
5. API contract/OpenAPI validation, integration tests with ephemeral
   PostgreSQL/Redis, targeted Playwright/axe tests;
6. migration lint/validate and schema drift check;
7. publish test artifacts: test results, Playwright trace/screenshots,
   coverage, vulnerability report.

### Main/staging

Build and sign/version immutable images/artifacts using commit SHA; deploy same
artifact to staging; run migrations through controlled job; execute full
critical E2E, provider sandbox/webhook, DAST baseline, performance smoke,
accessibility/browser checks, and synthetic health flow.

### Production

Require protected environment approval for high-risk releases. Deploy canary or
rolling API/worker/frontend release under feature flags. Run post-deploy
readiness/synthetic checks, observe error/latency/queue/webhook metrics, then
promote. GitHub Actions orchestrates; Render deployment hooks/API deploy
artifact. No automatic production deployment should bypass failed required
checks or environment review.

## 7. Database migration strategy

- Prisma Migrate is the schema authority; SQL is versioned only for PostgreSQL
  features Prisma cannot express.
- Use expand → backfill → dual-read/write where needed → cut over → contract,
  never destructive immediate changes on live high-value data.
- Each migration has owner, risk, lock/runtime estimate, rollback/forward
  recovery, data validation, backup/PITR checkpoint, and staging rehearsal.
- Run migrations as one controlled job with migration-only credentials before
  application version that requires the new schema; feature flag writes until
  backfill succeeds.
- Never use automatic application startup schema creation, manual production
  `ALTER`, or unreviewed destructive migration.

## 8. Rollback and disaster recovery

### Rollback

Application rollback promotes prior immutable artifact. Database rollback is
not assumed; use forward-compatible migrations, flags, dual-read/write, and
forward repair. Maintain emergency kill switches for risky integrations, AI,
campaigns, provider delivery, and background consumers.

### Backup/recovery

PostgreSQL uses managed automated backups, point-in-time recovery, encrypted
snapshots, retention policy, and regular restore drills. Object storage/media
uses provider durability plus metadata/relationship backup. Redis is not the
sole source for business state. Define and test RPO/RTO per service; initial
targets should be approved by business but production must have explicit
documented targets.

Disaster recovery runbooks cover database restore, region/provider outage,
Redis loss, queue backlog, credential compromise, failed deployment,
webhook/provider outage, and data corruption. Run tabletop and restore drills
at least quarterly after launch.

## 9. Monitoring, logging, alerting, and tools

| Need | Recommended tool class |
| --- | --- |
| Error tracking | Sentry for React/Node errors, releases, traces, user-safe context. |
| Metrics/APM/logs | OpenTelemetry instrumentation exported to Datadog, Grafana Cloud, New Relic, or equivalent managed platform. |
| Logs | Structured JSON logs in platform provider plus centralized searchable retention (Datadog/Grafana Loki/Better Stack). |
| Uptime/synthetics | Checkly, Datadog Synthetics, Grafana Cloud, or equivalent for public/API/auth/payment/tracking synthetic flows. |
| Alerts/on-call | PagerDuty/Opsgenie or managed alerting routed by severity/runbook/owner. |
| Product analytics | Privacy-governed PostHog/Amplitude/warehouse model; never replace operational audit. |
| Security/SAST/secrets | GitHub Advanced Security/CodeQL, Gitleaks, Semgrep; dependency review/Snyk/Dependabot. |
| Container scanning | Trivy, Snyk Container, or GitHub container scanning; scan base and final image. |
| DAST | OWASP ZAP baseline plus authenticated targeted security testing. |

Instrument request ID/trace ID, user/org scope only where safe, route, latency,
error code, database/Redis/provider timing, queue depth/age, Socket.IO
connections/event lag, webhook verification/failure, migration health, and
business synthetic outcomes. Redact PII, credentials, tokens, financial
details, documents, and prompt content.

## 10. Health checks and SLOs

- **Liveness:** process can respond; no dependency checks.
- **Readiness:** database/Redis essential connectivity, migration compatibility,
  required configuration, and worker dependency readiness appropriate to
  service.
- **Startup:** validates configuration/migrations, emits version/build/region.
- **Synthetic:** public page, login sandbox, authorized API, critical queue/
  webhook and tracking projection paths.

Define SLO/error budgets for API availability/latency, critical command
success, authentication, payment webhook processing, notification queue delay,
tracking event freshness, database health, and Socket.IO delivery. Alerts are
actionable, deduplicated, severity-defined, linked to runbook and owner, and
tested.

## 11. Scaling strategy

Start with separate API, worker, static frontend, managed PostgreSQL, and
managed Redis. Scale API/worker horizontally based on CPU/memory/latency/queue
lag; protect PostgreSQL through pooling, query budgets, indexes/read
projections, caching, and reporting isolation. Use CDN/media optimization for
public/catalog assets. Split workloads only when measured bottlenecks/team
ownership justify cost: search/indexing, analytics warehouse, document
processing, AI, carrier ingestion, and realtime fan-out are likely first
candidates.

Render is suitable for an early production workload but reassess when required
regions, private network topology, high Socket.IO concurrency, queue scale,
compliance/data-residency, VPC/KMS, or RTO/RPO needs exceed its service
capabilities. Portability is preserved through Docker, managed interfaces,
OpenTelemetry, and declarative environment contracts.

## 12. Production release checklist

- [ ] Immutable artifact built, scanned, signed/provenance recorded.
- [ ] Required CI/security/accessibility/performance/API/E2E gates passed.
- [ ] Environment/secrets/configuration validation passed; no secret exposure.
- [ ] Migration/backfill/restore/rollback/feature-flag plan reviewed.
- [ ] Health/readiness/synthetic checks, dashboards, alerts, runbooks, owner.
- [ ] Backup/PITR status and recovery drill evidence current.
- [ ] Canary/rollout/monitoring/rollback decision owner available.

## Final quality bar

HAMD deployment is production-ready only when the team can build, test, deploy,
observe, scale, roll back, restore, and investigate the platform safely without
manual production mutations or undocumented tribal knowledge.
