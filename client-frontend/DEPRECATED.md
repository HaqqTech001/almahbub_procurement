# DEPRECATED - Version 1 Buyer / Marketing Client

**Status:** DEPRECATED / ARCHIVED IN PLACE  
**Date:** 2026-08-06  
**RC:** RC5.1  

## Do not use for new work

This tree is the Version 1 buyer + marketing SPA. It is retained as a **migration reference only**.

| Concern | Location |
| --- | --- |
| V2 buyer workspace (`apps/client` identity) | `apps/web` `/app/*` |
| V2 public marketing | `apps/web` public routes |
| V2 API | `apps/api` |

## Rules

1. **Do not delete** this directory.
2. **Do not add features** here.
3. **Do not point production traffic** here after cutover.
4. Use it only to verify historical V1 behaviour during regression reviews.

## Reports

- `docs/96-rc51-v1-client-migration-report.md`
- `docs/97-rc51-feature-parity-matrix.md`
- `docs/98-rc51-regression-report.md`
- `docs/99-rc51-cutover-checklist.md`

## Cutover blockers (honest)

Full production cutover from this SPA is **blocked** until:

1. Support chat hosted against a V2 communication API (V2 API has no chat module yet).
2. Buyer announcements feed hosted (or explicitly deferred with product sign-off).
3. Procurement requests wired from localStorage UI to `GET/POST /api/v1/procurement-requests`.

See the cutover checklist for the full gate list.
