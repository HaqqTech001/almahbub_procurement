# Admin authority implementation report

**LEGACY ADMIN AUDIT COMPLETE**

This phase inspected the entire V1 admin surface (`admin-dashboard/` + `backend/`), not only requests, announcements, or the user list. V1 remains read-only. V2 recovered evidenced capabilities into permissions, command payloads, `UserStatus`, membership roles, and the existing announcement/media/procurement engines.

Capability matrix: `docs/legacy-admin-complete-capability-audit.md`  
Permission matrix: `docs/v2-admin-permission-matrix.md`

## 1. Every V1 admin capability discovered

Covered in the matrix (modules A–S): users, requests, orders-as-request-alias, quotations (none), announcements (CRUD, pin, schedule, expiry, media, replies), categories, products (API live, UI commented out of nav), chat, notifications inbox, trackers, AI knowledge, dashboard, settings mock, services API without nav, auth/verification.

## 2. Already present in V2

Procurement command machine; Ops request approve/decline/start purchase; announcement CMS + media; International product CMS; categories create/edit; IE commodities (isolated); support chat; notifications inbox; shipments; invoices/payments (V2-native); dashboard KPIs; knowledge API; audit log; organisations read-only directory; auth verify/reset; `#Hamd'26` from `apps/web/src/content/campaigns.ts`.

## 3. Missing before this phase

- User suspend/activate/deactivate as persisted `UserStatus` (Ops Users was a read-only list)
- User → admin mapped through membership roles
- Announcement pin / schedule / expiry
- AI Assistant and Notifications buried (page existed, not in ops nav)

## 4. Restored (V2-shaped)

- Ops user administration: search, detail, request count, confirmed suspend/activate/deactivate, grant/revoke `ops_admin`
- Announcement `pinned`, `scheduledFor`, `expiresAt` with public live-window filtering
- AI Assistant and Notifications in ops navigation
- Account-status filter on the identity directory

## 5. Deliberately not restored, and why

| V1 | Why not |
|---|---|
| Hard-delete users | V1 blocked delete when orders existed. V2 deactivates and keeps data |
| `role=admin` from the browser | Privilege escalation. Mapped to `ops_admin` + `ops:access` |
| Moderator role | String only; no distinct V1 permission set |
| Admin-edited profile fields | API existed; Edit button unwired |
| Add User / Download | Buttons with no handlers |
| Admin password reset | Not in V1 users API |
| V1 Settings (SMTP, backup, branding) | Local form, no API |
| Free-form request status | Replaced by command machine |
| Parallel orders engine | Duplicate of requests |
| Announcement replies | V1 social comments; V2 uses Support threads |
| Announcement audience/type/tags | No V2 taxonomy; public slider is global |
| Category image/icon/color/sort | Decorative; product media covers merchandising |
| Payment admin as V1 recovery | V1 had no payment admin UI |
| Org verification admin | V1 had no organisations |

## 6. User-management improvements

Commands, not raw status/role injection. Sessions revoked on suspend/deactivate. Last ops admin and self-change blocked. Activation cannot skip email verification. Buyer “My account” is unchanged.

## 7. Procurement improvements

No second engine. Existing `request:manage` commands remain the authority path.

## 8. Announcement improvements

Pin, schedule, and expiry are columns plus validated PATCH fields. Public GET hides not-yet-live and expired rows. `#Hamd'26` is not CMS-editable.

## 9. Media improvements

No second store. Announcement media remains `AnnouncementMedia` → `StoredDocument`.

## 10. Product/category administration

International products CMS already exceeded the commented-out V1 UI. IE commodities stay isolated.

## 11. Organization/business administration

V1 had a company string. V2 organisations stay a read-only directory. No invented verification workflow.

## 12. Notification / messaging / document administration

Notifications: own inbox, now in nav. Chat: Support. Documents: existing StoredDocument + request/announcement attachments. No V1 broadcast composer.

## 13. Dashboard / analytics

V2 Ops dashboard already exceeds V1 counts/charts. Unchanged.

## 14. Permission model

No new catalog keys. User admin uses `ops:access`. CMS uses existing parity manage keys (`ops:access` | `cms:manage` | `communication:publish`). AI nav uses `guidance:manage`. See `docs/v2-admin-permission-matrix.md`.

## 15. Security tests

- Unauthenticated user status PATCH → 401
- Buyer user status / ops-access / announcement pin → 403
- Ops suspend command → 200 (service mocked at route)
- `{ role: "admin" }` / `{ status: "active" }` without command → 422
- Self-suspend / last ops admin → 400 / 409
- Unknown user → 404
- Pending verification cannot be activated
- Suspended users already fail authenticate (`user.status === "active"`)

## 16. Navigation

V1 modules mapped in the audit. Settings not restored. AI Assistant and Notifications added to ops nav. Buyer surfaces do not mount admin controls.

## 17. Copy cleanup

Ops Users/Organisations/Account empty values no longer use em dashes. `#Hamd'26` and approved IE copy untouched.

## 18. Unit tests

- `ops-identity-admin.test.ts` (6)
- `announcement-visibility.test.ts` (3)
- `admin-nav.test.ts` (3)
- `UsersPage.test.tsx` (administrative actions, not hard delete)

## 19. Integration / route tests

- `ops-access-routes.test.ts` (buyer 403, unauth 401, malformed 422, ops 200)
- `announcement-admin-routes.test.ts` (buyer cannot pin)
- `route-policy.test.ts` (new identity PATCH policies)

## 20. Playwright

`apps/ops/e2e/legacy-admin-users.spec.ts`: manage-users copy, 320–1920 viewports, axe WCAG AA on Users. This run skipped (no `HAMD_OPS_E2E_EMAIL` / `HAMD_OPS_E2E_PASSWORD` in the Playwright environment). Existing phase-7 admin spec still covers dashboard and module reachability when those credentials are set.

## 21. axe

Covered in the Users Playwright spec (`wcag2a`, `wcag2aa`) and existing ops login/dashboard axe test.

## 22. Typecheck

`@hamd/api`, `@hamd/ops`, `@hamd/web`, `@hamd/ui` — passed after regenerating Prisma client types.

## 23. Lint

`@hamd/ops`, `@hamd/web` — passed. `@hamd/api` changed files — passed (type-import on identity admin test).

## 24. Build

`@hamd/api`, `@hamd/ops`, `@hamd/web`, `@hamd/ui` — passed. Apply migration `20260818140000_announcement_pin_schedule` before using pin/schedule against a live database.

---

Phase stop: no unrelated feature work after this report.
