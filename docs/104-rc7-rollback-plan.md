# RC7 - Rollback Plan

**Goal:** Restore Version 1 traffic if Genesis cutover fails - **without deleting anything**.

## Preconditions

- V1 trees remain on disk: `backend/`, `client-frontend/`, `admin-dashboard/`
- Prior DNS / reverse-proxy config backed up before cutover
- V1 MySQL + env files (`backend/.env`, client/admin `VITE_API_URL`) intact

## Rollback procedure (≤ 30 minutes)

1. **Freeze Genesis deploys** (`apps/api`, `apps/web`, `apps/ops`).
2. **Point DNS / proxy** back to V1:
   - API → `backend` (port 5000)
   - Buyer → `client-frontend` (5173 / prior host)
   - Admin → `admin-dashboard` (5174 / prior host)
3. **Verify** V1 `/api/health`, login, one request create, admin login.
4. **Communicate** status to buyers/ops (maintenance window closed / rolled back).
5. **Leave Genesis running** in staging for diagnosis - do not delete.

## Data caveats

- Requests created only on Genesis Postgres after cutover will **not** appear in V1 MySQL.
- If cutover window allowed dual-write, prefer Genesis as SoT and export critical rows before rollback.
- Password changes on Genesis after cutover require password reset on V1 if rolled back.

## Decision record

| Field | Value |
| --- | --- |
| Rollback owner | |
| Trigger criteria | Error rate / auth failure / chat outage SLA breach |
| Max rollback window | 72h after cutover (adjust) |
| Sign-off | |

## After rollback

- Keep `READ_ONLY.md` markers (V1 remains archive intent) **or** temporarily lift READ ONLY only for emergency hotfixes with written approval.
- File incident + re-attempt cutover date.
