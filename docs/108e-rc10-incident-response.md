# RC10 - Incident Response

## Severity

| Sev | Definition | Response |
| --- | --- | --- |
| SEV1 | Total outage / auth down / data loss risk | Immediate page; consider rollback |
| SEV2 | Major feature broken (requests, payments, shipments) | 15m ack; hotfix or rollback |
| SEV3 | Degraded (slow, partial UI) | Business hours |
| SEV4 | Cosmetic / docs | Backlog |

## First 15 minutes

1. Acknowledge + open incident channel
2. Check `/health/ready`, Postgres, Redis, recent deploy
3. Capture failing `requestId`s and sample responses
4. Decide: mitigate in place vs [rollback](./108b-rc10-rollback-plan.md)

## Communication

- Internal: status every 15–30m for SEV1/2
- External: honest status for buyers if request/payment path affected
- Never share secrets or raw PII in public status

## Security incidents

Suspected credential leak / token theft:

1. Rotate `JWT_ACCESS_SECRET` and invalidate refresh sessions (`logout-everywhere` / session revoke)
2. Rotate DB, Redis, Resend, AI, and OAuth secrets as applicable
3. Review gitleaks / access logs
4. Preserve forensic logs before redeploy

## Post-incident

Blameless RCA within 5 business days: timeline, impact, root cause, corrective actions, verification.
