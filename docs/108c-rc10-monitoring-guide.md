# RC10 - Monitoring Guide

## Health endpoints

| Endpoint | Meaning |
| --- | --- |
| `GET /health/live` | Process up |
| `GET /health/ready` | DB (and configured deps) ready |

Probe `ready` for load-balancer membership; `live` for restart policy.

## Signals to watch (first 72h)

| Signal | Source | Alert idea |
| --- | --- | --- |
| 5xx rate | API access logs / APM | >1% for 5m |
| Auth login failures | Auth module + lockouts | Spike vs baseline |
| Rate-limit 429 | Redis / memory limiter | Sustained burst |
| Request transition errors `INVALID_STATE_TRANSITION` | App logs | Unexpected 409 surge |
| Notification dispatch lag | Worker / outbox | Age > SLA |
| Copilot `AI_NOT_CONFIGURED` vs provider errors | AI module | Distinguish misconfig vs outage |
| Frontend JS errors | RUM / browser | New release cohort |

## Logging

- Structured JSON via Pino; `requestId` on API requests
- Never log tokens, passwords, or full card/PII payloads
- Correlate buyer reports with `requestId` from error envelope

## Dashboards (minimum)

1. API availability + latency p50/p95 by route group
2. Auth success / lockout / refresh failures
3. Postgres connections + slow queries
4. Redis memory + rate-limit hits
5. Deploy marker annotations

## On-call

Page on `ready` failure, auth outage, or payment/shipment write path 5xx. Use [108e](./108e-rc10-incident-response.md).
