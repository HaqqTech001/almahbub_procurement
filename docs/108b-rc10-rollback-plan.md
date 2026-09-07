# RC10 - Rollback Plan

**Goal:** Restore prior stable traffic within **≤ 30 minutes** without deleting Genesis or V1 artifacts.

## Triggers

- Auth failure rate exceeds SLO (e.g. >5% 401/5xx on `/api/v1/auth/*` for 10 minutes)
- API readiness failing / Postgres unreachable
- Buyer or ops SPA unusable (blank shell, cascading 5xx)
- Data-corrupting bug in procurement / payment / shipment transitions

## Procedure

1. **Freeze** Genesis deploys (CI + platform).
2. **Point DNS / reverse proxy** to last-known-good:
   - Preferred: previous Genesis release artifact (same stack)
   - Emergency: V1 (`backend/`, `client-frontend/`, `admin-dashboard/`) per [104](./104-rc7-rollback-plan.md)
3. **Confirm** health + one login + one request read/create.
4. **Communicate** status to buyers/ops.
5. **Keep** failed release artifacts and logs for RCA; do not delete.

## Data caveats

- Genesis Postgres is SoT after cutover. Rows created only on Genesis will not appear in V1 MySQL.
- Password / session state does not transfer across V1 ↔ V2.
- If rolling back to prior Genesis image, also roll back schema **only** if migrations are reversible; otherwise forward-fix.

## Decision record

| Field | Value |
| --- | --- |
| Rollback owner | |
| Max rollback window after cutover | 72h (adjust) |
| Sign-off | |
