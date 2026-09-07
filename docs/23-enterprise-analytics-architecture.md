# HAMD Enterprise Analytics Architecture

**Purpose:** Give executives and operating teams reliable, role-scoped,
actionable intelligence across commercial performance, procurement, finance,
logistics, support, product, website, and AI operations.

## 1. Analytics principles

- Metrics are governed definitions, not labels on charts.
- Every KPI exposes owner, calculation, time zone, currency treatment,
  freshness, source data, access scope, and drill-down record set.
- Operational decisions use near-real-time read projections; executive trends
  use validated analytics models. Do not query production transaction tables
  for every dashboard interaction.
- Analytics measures the past/present reliably before predicting the future.
- AI insights are cited, confidence-labeled suggestions-not autonomous business
  decisions.

## 2. Executive dashboard

### Attention layer

Open shipment exceptions, SLA breaches, payment/reconciliation risk, approval
backlog, compliance holds, data-quality failures, system/API incidents, and
forecast anomalies. Each item has owner, severity, source, age, next action,
and direct authorized drill-down.

### KPI layer

Revenue, service margin/profit, procurement volume, customer growth, quotation
conversion, supplier quality, active shipment/OTIF, payment/invoice aging,
support response/resolution, website conversion, product discovery/request
conversion, and AI safety/usage quality.

### Insight layer

Trends by period/entity/country/corridor/category/customer tier/supplier/mode,
variance against target, cohort/funnel views, saved views, scheduled reports,
and evidence-backed AI insights.

## 3. KPI catalogue

| KPI group | Definition and decision use |
| --- | --- |
| Revenue | Issued/recognized service and commercial revenue by legal entity/currency/period. Define recognition policy; never mix quoted pipeline with revenue. |
| Profit/margin | Revenue less approved attributable product/freight/duty/service/operating cost under published accounting policy. Shows variance and data completeness. |
| Procurement volume | Submitted/accepted/quoted/awarded request value and line count; segmented by category, country, customer, officer, and status. |
| Supplier performance | On-time-in-full, quality/inspection pass rate, response time, quote acceptance, defect/dispute, certificate freshness, and risk status. |
| Country/corridor performance | Cycle time, landed-cost variance, customs/document exception, OTIF, freight cost, and compliance holds by approved corridor. |
| Customer growth | New/active/retained/reactivated organizations, request frequency, account health, expansion, churn reason. |
| Conversion | Visitor→lead→registered→request→quote→accepted→paid→delivered funnel, with attributable source and excluded/test traffic policy. |
| Lead sources/website | Organic/referral/campaign/direct source, qualified lead rate, request completion, content performance, consent-aware web events. |
| Product performance | Search success, zero-result rate, product views/saves/compare/request rate, catalog completeness, recommendation outcome. |
| Support | First response, resolution, reopen, SLA compliance, CSAT, category/route cause, backlog aging. |
| Delivery | OTIF, ETA accuracy, milestone freshness, exception rate/response, inspection failure, warehouse dwell, POD completion. |
| Finance | Invoice aging, payment confirmation, reconciliation lag, allocation accuracy, refund/dispute, cash forecast. |
| AI | Usage, latency/cost, cited-answer rate, confidence distribution, feedback/correction/escalation, safety/policy incidents, task outcome. |

## 4. Data architecture

### Sources and event model

Transactional domains write immutable outbox/domain events for requests, quotes,
approvals, POs, invoices, payments, shipments, documents, support, catalog,
CMS, notifications, AI, and web events. An analytics pipeline validates,
deduplicates, versions, and projects them into read models/warehouse tables.

### Storage layers

1. **Operational read models:** PostgreSQL materialized/projection tables for
near-real-time queues and dashboard attention widgets.
2. **Analytics warehouse/lakehouse:** dimensional fact/dimension model for
large aggregates, historical analysis, scheduled reports, and forecasting.
3. **Semantic metric layer:** canonical calculations, filters, ownership,
currency/time treatment, access rules, and definitions consumed by API/UI.
4. **Catalog/metric registry:** metric ID, formula/version, owner, source
lineage, freshness SLA, sensitivity, and deprecation.

### Core dimensions/facts

Dimensions: date/time, organization, customer, supplier, country/corridor,
currency, category/product, user/team, shipment mode, channel, campaign,
status, legal entity. Facts: procurement request/line, quote/option, PO/line,
invoice/line, payment/allocation, shipment/milestone/exception, support event,
catalog event, website event, AI usage, notification delivery.

PII and high-risk finance/security fields are minimized, tokenized, or
excluded from analytics. Data retention, deletion, consent, and legal hold
propagate through warehouse and derived datasets.

## 5. Frontend experience

- Dashboard filters are explicit, visible, saveable, shareable only within
  authorization scope, and apply a known time/currency/entity context.
- Charts have specific title, unit, metric definition, source/freshness,
  accessible table alternative, legend/direct labels, comparison period, and
  drill-down.
- Interactive filters use allowlisted dimensions; no arbitrary analytical SQL
  in browser.
- KPI cards show value, definition, freshness, variance, and relevant action.
- Loading preserves shell/context; widget-level error/retry; empty differs from
  filter-zero/data-delay/permission error; long exports/reports run async.
- Mobile prioritizes attention/KPI/filtered summary and detail drill-down,
  rather than dense desktop analytics canvas.

## 6. API and reporting

| API group | Purpose |
| --- | --- |
| `/api/v1/analytics/dashboards/{key}` | Role-scoped dashboard with allowlisted time/entity/corridor/category filters and metric freshness. |
| `/api/v1/analytics/metrics/{key}` | Metric value, definition, dimensions, trend, source/freshness, authorized drill-down metadata. |
| `/api/v1/analytics/drilldowns/{key}` | Cursor-paginated authorized source records behind a metric. |
| `/api/v1/reports` | Saved report definition, scope, schedule, recipients, export policy. |
| `/api/v1/reports/{id}/runs` | Async PDF/Excel/CSV generation; idempotent, audited, expiry-controlled signed result. |
| `/api/v1/analytics/insights` | Cited rule/AI insight, confidence, evidence, feedback/escalation, no autonomous action. |
| `/api/v1/admin/analytics/metrics` | Metric registry/definition/version/freshness management for authorized data owners. |

Every endpoint applies Phase 8 authentication, tenant/role authorization,
validation, rate limits, cache policy, audit, pagination/filter/sort/search,
structured error, and OpenAPI contract. Exports are rate/row-size limited,
backgrounded, encrypted/signed, expiring, and logged.

## 7. Permissions and security

- Executives receive aggregate views only for authorized entities/regions.
- Finance, supplier, HR/candidate, security/audit, and customer PII metrics
have separate permissions and data masking.
- Drill-down rechecks record authorization; a chart aggregate must not become a
side channel to inaccessible customer/supplier data.
- Metric-definition changes, exports, schedule recipients, and AI insight
configuration are audited and may require dual review.
- Use row/column-level warehouse access controls, secure service credentials,
  encrypted storage, query timeouts/limits, and redacted logs.

## 8. Performance and reliability

- Precompute common aggregates; cache scoped dashboard queries with short TTL
  and event-driven invalidation; never cache unauthorized user result broadly.
- Partition high-volume event/fact tables, index dimensions/time, use
  incremental transformation, backfill/reconciliation jobs, freshness monitors,
  and data-quality alerts.
- Report generation is queued with concurrency, cancellation, dead-letter, and
  watermark handling. PDFs are presentation outputs; CSV/Excel preserve
  documented data format and export limits.
- Reconcile analytics totals to finance/transactional controls; metric
  discrepancy is a data incident, not a UI formatting issue.

## 9. Forecasting and AI insight

### Initial forecasting

Use transparent baseline forecasts for procurement demand, cash collection,
shipment arrival risk, support volume, and supplier lead time only where data
quality/history supports them. Show forecast range, confidence, training period,
freshness, drivers, and actual-vs-forecast evaluation.

### AI insights

AI can identify trend changes, anomalies, bottlenecks, missing data,
opportunities, and proposed questions. Each insight cites metrics/records,
states uncertainty, offers a safe action/drill-down, and supports dismiss/
feedback/escalate. It cannot alter prices, suppliers, policies, forecasts, or
operational decisions automatically.

### Future ML

Feature registry, model registry/version, offline/online evaluation,
drift/bias monitoring, human override, retraining approval, explainability,
and rollback are required before production prediction affects workflows.

## 10. Release quality bar

Analytics is production-ready when every executive metric is defined,
traceable, fresh enough for its stated use, permission-scoped, accessible,
drillable, exportable under policy, and reconciled to authoritative business
records. An attractive chart without definition or lineage is not a business
insight.
