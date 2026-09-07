# Phase 6B — Durable catalogue media + footer integrity

Do not treat a green unit build as production readiness.

Phase 6B overall: **PARTIAL / BLOCKED**. Footer, Group/IE navigation, Ops authorization cleanup, and fail-closed storage wiring passed on 2026-08-13. Durable object-storage credentials are **not** present in this environment, so catalogue photographs are **not** production-safe across container restart/redeploy.

| Gate | Status | Evidence |
|---|---|---|
| Catalog schema applied | PASS | Phase 6A + live `GET /api/v1/products` 200 |
| Live catalog API 200 | PASS | Empty published list (`total: 0`) |
| Ops authorization correct | PASS | Staff `almujahidalimam@gmail.com` keeps `ops_admin` + `ops:access`. Temporary e2e user revoked (now `org_admin` only; `/api/v1/ops/products` → 403). Buyers/org_admin registration still do not receive `ops:access` |
| Ops product lifecycle | PASS | Phase 6A browser gate + Phase 6B Ops smoke (dashboard / products / announcements) |
| Product image upload | PASS | Ops upload + public GET 200 (`verify-phase6b-catalog-media.ts`) |
| Image persists after restart/redeploy | BLOCKED | Local disk survives a **new process** on the same host volume (`secondProcessImageStatus: 200`). `CATALOG_MEDIA_DRIVER=local`. No S3/Supabase credentials. Production still rejects `local` |
| Announcement lifecycle | PASS | Phase 6A |
| Footer only real destinations | PASS | Unit + Playwright footer integrity on Home/About/Products/Services/Industries/FAQ/Group/International profile/IE portal |
| No old dead footer links | PASS | Dead hrefs remain only as the automated denylist, not as live links |
| Integrated Export footer opens portal | PASS | Homepage, Group, International profile, and IE portal footer all open `/businesses/almahbub-integrated-export` with `.hamd-aie-portal` chrome |
| Group/business hierarchy | PASS | Footer identity: Almahbub Group → International (procurement · sourcing · supply · logistics) → Integrated Export (agro commodities · bulk supply · export) |
| Responsive 320–1920 | PASS | Footer overflow checks; no page-level horizontal overflow |
| axe WCAG A/AA light+dark | PASS | Home, Group, International profile, IE portal (footer included) |
| No stuck skeleton | PASS | SPA footer About → Products |
| No test product remains public | PASS | `publicPhase6BLeft = 0` |

## Storage configuration (required before production photographs)

Choose **one** driver. Do not leave `CATALOG_MEDIA_DRIVER=local` when `NODE_ENV=production` — boot fails closed.

### Option A — Supabase Storage (preferred if Postgres is already Supabase)

```
NODE_ENV=production
CATALOG_MEDIA_DRIVER=supabase
CATALOG_MEDIA_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY=  # server-side only
CATALOG_MEDIA_SUPABASE_BUCKET=catalog-public
```

Create a **public** bucket named `catalog-public` (or match `CATALOG_MEDIA_SUPABASE_BUCKET`). Objects are stored at `catalog/{productId}/{filename}`.

### Option B — S3 / S3-compatible

```
NODE_ENV=production
CATALOG_MEDIA_DRIVER=s3
CATALOG_MEDIA_S3_BUCKET=almahbub-catalog-public
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
# optional CDN:
# CATALOG_MEDIA_S3_PUBLIC_BASE_URL=https://cdn.example.com
```

Private StoredDocument procurement attachments stay on `UPLOAD_ROOT` / `/api/v1/documents`. Catalogue photos do not share that store.

This environment: `CATALOG_MEDIA_DRIVER=local`, no AWS/Supabase storage keys. Deployment configuration is **pending**.
