# RC10 - Backup Guide

## What to back up

| Asset | Frequency | Retention | Notes |
| --- | --- | --- | --- |
| Postgres (logical + PITR) | Continuous PITR + daily snapshot | ≥ 30 days | Primary SoT |
| Object / media store | Provider versioning | Match compliance | If Cloudinary/S3 used |
| Secrets inventory | On change | Encrypted vault | Not in git |
| Migration history | With DB | Forever | `database/prisma/migrations` in git |
| Redis | Optional | None required | Disposable |

## Pre-cutover

1. Take a named Postgres snapshot: `pre-v2-cutover-YYYYMMDD`
2. Export critical ops contact list offline
3. Verify restore of a **staging** copy from the same backup pipeline within 7 days prior to launch

## Restore drill (quarterly)

1. Provision empty Postgres
2. Restore snapshot / PITR to T-1h
3. Run `prisma migrate status`
4. Point staging API at restored DB; smoke auth + one request

## Local Docker volumes

`docker compose` volumes `hamd-postgres-data` / `hamd-redis-data` are **dev only** - not a production backup strategy.
