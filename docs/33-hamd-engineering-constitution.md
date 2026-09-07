# HAMD Engineering Constitution

**Project:** HAMD Genesis  
**Brand:** Almahbub International  
**Powered by:** HAQQ TECH  
**Status:** Normative engineering policy  
**Version:** 1.0

## 1. Authority and interpretation

This constitution is the highest project-level engineering authority. Every
engineer, AI assistant, contributor, automation, and future update must follow
it. Where implementation, local convention, or a lower-level document conflicts
with this constitution, this constitution prevails.

It does not override law, binding contractual obligations, emergency security
containment, or a formally approved replacement constitution. Changes require
an Architecture Decision Record, named owner, migration impact assessment, and
approval by product, engineering, security, and operations owners.

## 2. Engineering principles

1. **Protect user trust before shipping speed.**
2. **Model business truth explicitly.** Status, money, identity, approval, and
   physical milestones are never inferred from chat or presentation state.
3. **Prefer simple, observable systems.** A modular monolith is the default;
   distribute only when measured constraints require it.
4. **Make invalid states difficult to represent.**
5. **Design for correction, not silent mutation.** Immutable records are
   superseded, credited, versioned, or appended to.
6. **Accessibility, security, and performance are acceptance criteria, not
   polish phases.**
7. **Automate repetitive work; retain human authority over consequential
   decisions.**
8. **Build shared abstractions only after real repeated use.**
9. **Document decisions where work happens.**
10. **Leave every system safer, clearer, and more maintainable than found.**

## 3. Philosophy

### Product and business

HAMD is managed procurement software, not an uncontrolled marketplace. The
product must show current fact, owner, evidence, next action, and uncertainty.
Commercial commitments require governed records, authorization, and audit.
Revenue optimization never justifies hidden fees, misleading ETAs, coerced
consent, or inaccessible service.

### User experience and design

The experience is calm, trustworthy, intelligent, human, global, efficient,
and transparent. Typography leads hierarchy; semantic color reinforces it.
Whitespace clarifies decisions. Every meaningful screen answers: where am I,
what can I do, and what should I do next. Loading, empty, error, success,
offline, keyboard, and reduced-motion states are first-class.

### Accessibility

WCAG 2.2 AA is the minimum. Interfaces require semantic HTML, full keyboard
operation, visible focus, screen-reader names/statuses, 4.5:1 normal-text
contrast, 3:1 control/focus contrast, target sizes appropriate to context, and
reduced-motion equivalents. No workflow may require color, hover, pointer
precision, sound, or a CAPTCHA alone to complete.

### Performance

Performance is a user-trust feature. Optimize real user journeys, slow networks,
low-end devices, operational queues, and database cost. Measure before
optimizing; eliminate unnecessary work before adding caches.

### Security and privacy

Deny by default, validate at every trust boundary, minimize data collection,
encrypt in transit and at rest, use least privilege, rotate secrets, and audit
consequential actions. No secret, credential, token, connection string, or
personal data enters source control, logs, tests, screenshots, or AI prompts.

### AI

AI assists; it does not impersonate authority. It must disclose uncertainty,
cite permitted sources where applicable, preserve tenant/document permissions,
avoid training on customer data by default, and never autonomously approve,
commit, pay, publish, or assert unverified logistics facts.

### Motion, content, SEO, and internationalization

Motion communicates hierarchy, progress, relationship, or confirmation; it
never decorates for its own sake. Content is factual, concise, inclusive,
localized, and owned. Public pages use semantic metadata, canonical URLs,
sitemaps, structured data, fast assets, and accessible headings. All business
data supports locale, time zone, currency, country, language, Unicode, and
right-to-left readiness; never hardcode a country, currency, date format, or
English-only state into domain logic.

## 4. Architecture standards

### Structure and ownership

```text
apps/       deployable surfaces
packages/   reusable, independently owned contracts/config/UI/utilities
database/   Prisma schema, migrations, seeds, factories
docs/       decisions, specifications, runbooks
scripts/    repeatable repository operations
.github/    CI, security, release automation
```

Legacy systems remain outside the new workspace until approved cutover. New
work must not import legacy source. Folder names are lowercase kebab-case;
TypeScript files are kebab-case; React components are PascalCase; hooks begin
with `use`; booleans begin with `is`, `has`, `can`, or `should`.

### Backend boundaries

- **Controller:** transport, authentication context, validation invocation,
  response mapping; no domain rule or query composition.
- **Service/application command:** transaction boundary, orchestration,
  authorization/policy invocation, events.
- **Repository:** persistence only; no HTTP, presentation, or cross-domain
  policy.
- **Schema/DTO:** runtime validation plus stable API contract; never expose
  database records directly.
- **Policy/guard:** relationship, permission, state, and SoD checks.
- **Job/worker:** idempotent asynchronous work with retry, dead-letter path,
  trace/correlation ID, and bounded concurrency.
- **Middleware:** cross-cutting transport behavior only.

Controllers do not write status fields directly. State transitions use named
domain commands. Repositories do not decide permissions. Services do not accept
unvalidated `unknown` data.

### API and events

APIs are versioned under `/api/v1`, resource-oriented, paginated, filterable,
sortable, searchable, documented, and consistent in error shape. Mutating
commands use idempotency keys where retries can duplicate value. API errors are
safe, structured, localized where user-facing, and contain a request ID.

Domain events use the transactional outbox. Event payloads are versioned,
minimal, tenant-scoped, idempotent, observable, and past-tense facts. Events
do not carry secrets or command subscribers to bypass policies.

### Database

PostgreSQL and Prisma are the authoritative transactional store. Use UUIDv7,
UTC timestamptz, explicit foreign keys, indexes on filtered/foreign-key access,
unique business constraints, decimal money amounts plus ISO currency, audit
fields, and documented soft-delete policy. Do not globally hide soft-deleted
records with ORM magic. Migrations are expand/backfill/contract; production
rollback is a forward repair, not unsafe down SQL.

### Frontend

Use the HAMD design tokens and `@hamd/ui` once delivered. Components are
semantic, composable, variant-driven, dark-mode compatible, responsive, and
tested. Local duplicate design systems are forbidden. Hooks own reusable
client behavior; server state uses a query/cache layer; URL state is shareable;
forms have explicit validation and submission states.

## 5. Code standards

- Strict TypeScript; no implicit `any`, unbounded casts, or ignored compiler
  errors.
- Constants describe stable domain values; configuration belongs in validated
  environment contracts; secrets never become constants.
- Enums represent stable lifecycle vocabulary. Use lookup/versioned policy data
  for runtime-managed values.
- Utilities are pure, small, tested, and dependency-light.
- Validation occurs at API, event, job, file, and integration boundaries.
- Logging is structured and redacted; include service, request/correlation ID,
  actor/organization where permitted, operation, duration, and safe error code.
- Caching has owner, key, TTL, invalidation event, stale behavior, and
  authorization boundary. Cache is never authorization truth.
- Feature flags have owner, purpose, audience, expiry, rollout/rollback plan,
  and audit trail.

## 6. Quality budgets

### Performance budget

Public LCP target: ≤2.5s at p75 on supported mobile networks. Interaction
response: acknowledge within 100ms. API p95 targets are set per endpoint but
must have explicit pagination and query-cost bounds. No unbounded list, file
read, event replay, or database query is accepted. Bundle and image budgets are
enforced in CI when frontend surfaces exist.

### Accessibility budget

Zero known critical/serious automated accessibility violations in changed
surfaces; manual keyboard and screen-reader review for new workflow primitives;
no reduced-motion regression; no contrast exception without documented
equivalent.

### Security budget

Zero known critical vulnerabilities in production dependencies; no high
vulnerability without risk acceptance, owner, expiry, and mitigation. All
external input validated, authorization tested, secrets scanned, and file
uploads quarantined.

## 7. Definition of Ready

Work is ready only when it has user/business outcome, owner, scope boundaries,
acceptance criteria, permissions, states/transitions, API/database impact,
failure cases, analytics, accessibility requirements, security classification,
and test approach. Ambiguous destructive behavior requires a decision before
implementation.

## 8. Definition of Done

Work is done only when implementation is reviewed, validated, tested at the
right layers, documented, observable, accessible, performant, secure,
internationalization-ready, migration-safe, and deployable. It includes
loading/empty/error/success behavior, audit/event effects, rollback strategy,
feature-flag plan where relevant, and operational ownership.

## 9. Review checklists

### Code review

- Correct boundaries, names, types, validation, authorization, errors, and
  idempotency?
- Tests cover happy path, negative path, permissions, concurrency, and retry?
- No secret/PII leakage, N+1 query, unbounded work, or duplicated abstraction?
- UI includes semantic structure, states, keyboard handling, contrast, and
  reduced motion?

### Architecture review

- Is this the simplest reversible solution?
- Does it preserve transactional truth and tenant isolation?
- Are lifecycle, policy, audit, events, metrics, retention, and migration
  effects explicit?
- Does it introduce a service, dependency, cache, or abstraction without
  measured justification?

### Release/deployment checklist

- CI green, migrations rehearsed, backup/PITR checkpoint confirmed.
- Feature flag/rollout/rollback owner defined.
- Dashboards, alerts, runbook, support communication, and on-call ownership
  ready.
- Secrets/configuration validated in target environment.
- Smoke, permission, accessibility, and critical workflow tests passed.

## 10. Incident response and rollback

Classify incident severity, appoint incident commander, protect people/data,
stop unsafe writes, preserve evidence, communicate fact/impact/next update
time, mitigate, recover, reconcile, and publish a blameless post-incident
review with actions and owners.

Rollback favors traffic/flag/application rollback compatible with expand-only
migrations. Never run destructive rollback SQL under pressure. Payment,
identity, and shipment correction uses reconciled forward actions with audit
evidence.

## 11. Governance

This constitution is reviewed quarterly and after every P1 incident, material
security finding, or major platform change. Exceptions require written scope,
risk, compensating control, owner, expiry, and review date. Expired exceptions
are defects.
