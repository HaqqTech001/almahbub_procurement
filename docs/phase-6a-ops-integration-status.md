# Phase 6A — Ops → public catalogue integration status

Status of the real Ops → API → database → public catalogue workflow.
Do not treat a green unit build as this gate.

Phase 6A overall: **PARTIAL**. Browser lifecycle gates passed on 2026-08-13. Catalog image storage is still local-disk and is **not** production-safe across API restart/redeploy.

| Gate | Status | Evidence |
|---|---|---|
| Live `GET /api/v1/products` succeeds | PASS | 200 after `20260813120000_catalog_brand_manufacturer_images` |
| Database schema matches Prisma catalog domain | PASS | `brands`, `manufacturers`, `product_images`, `products.brand_id`, `products.manufacturer_id` |
| V1 published categories exist | PASS | Five taxonomy slugs on `GET /api/v1/categories` |
| Buyer does not have `ops:access` | PASS | Accidental `org_admin` `ops:access` revoked; registration defaults exclude it; buyer `/api/v1/ops/*` → 403 |
| Approved Ops user has `ops:access` | PASS | `almujahidalimam@gmail.com` explicit `ops_admin`. Browser login used a provisioned e2e Ops user (staff password unknown) |
| Ops app runs | PASS | `http://127.0.0.1:3001` with API `:4000` and public web `:3000` |
| Ops login / refresh / logout | PASS | Playwright `e2e/phase-6a-ops-gate.spec.ts` (e2e Ops user). Full reload refresh required CSRF cookie path `/` + sessionStorage csrf + StrictMode boot fix |
| Create draft → public invisible → upload → persist → publish → public visible → archive | PASS | Same spec, chromium-desktop, 2026-08-13. Temporary `phase6a-test-bed-*` archived after |
| Announcement draft → publish → homepage slider → archive | PASS | Same spec. Homepage slider consumed published CMS row; archive removed it. Wedding campaign may remain |
| Authenticated Ops responsive + axe | PASS | Widths 320–1920 on dashboard/products/categories/requests/quotations/invoices/payments/shipments/notifications/announcements. axe WCAG A/AA light + dark on dashboard/products/announcements |
| Catalog image storage production-safe | BLOCKED | `CATALOG_MEDIA_DRIVER=local` + `UPLOAD_ROOT=uploads` is container-local. Set `s3` or `supabase` with credentials before production photographs |

Claims such as “Phase 6 production-ready”, “Ops browser gate passed”, “product publish verified”, or “image persistence verified” are **not** a production-readiness declaration. Image persistence was proven in-process + database only. Durable object storage remains BLOCKED.
