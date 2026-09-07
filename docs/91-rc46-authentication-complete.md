# RC4.6 - Authentication Recovery & User Lifecycle

**Status:** COMPLETE  
**Date:** 2026-08-06  
**Quality gates:** `pnpm -r lint|typecheck|test|build` green for auth-critical packages (`@hamd/api`, `@hamd/web`, `@hamd/ui`). Root `turbo` may fail on this Windows host with “cannot find package manager binary”; use recursive `pnpm -r` as the local gate.

**Stack:** `apps/api` identity module + Prisma/Postgres (Supabase-compatible Postgres). Not Supabase Auth SDK.

Authentication recovery and full user lifecycle are implemented end-to-end:

Register → Verify Email → Login → Refresh → Forgot Password → Reset Password → Login → Logout → Logout All Devices

Organization creation on register and invitation create/accept are included.

## Completed API endpoints

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | public |
| POST | `/api/v1/auth/verify-email` | public |
| POST | `/api/v1/auth/verify-email/:token` | public |
| POST | `/api/v1/auth/resend-verification` | public |
| POST | `/api/v1/auth/otp/verify` | public |
| POST | `/api/v1/auth/otp/resend` | public |
| POST | `/api/v1/auth/forgot-password` | public |
| POST | `/api/v1/auth/reset-password` | public |
| GET | `/api/v1/auth/invitations/:token` | public |
| POST | `/api/v1/auth/invitations/:token/accept` | public |
| POST | `/api/v1/auth/invitations` | authenticated |
| POST | `/api/v1/auth/login` | public |
| POST | `/api/v1/auth/refresh` | public (CSRF) |
| POST | `/api/v1/auth/logout` | authenticated |
| POST | `/api/v1/auth/logout-everywhere` | authenticated |
| GET | `/api/v1/auth/sessions` | authenticated |
| DELETE | `/api/v1/auth/sessions/:sessionId` | authenticated |
| GET | `/api/v1/auth/devices` | authenticated |
| DELETE | `/api/v1/auth/devices/:deviceId` | authenticated |
| GET | `/api/v1/auth/login-history` | authenticated |
| GET | `/api/v1/auth/me` | authenticated |
| PATCH | `/api/v1/auth/profile` | authenticated |
| GET | `/api/v1/auth/validate` | authenticated |

Security controls: password policy, generic forgot/resend responses, refresh rotation + reuse detection, lockout (`AUTH_LOCKOUT_*`), login audit events, IP/user-agent hashing, trusted devices on remember-me, auth abuse rate limiter.

## Completed pages (`apps/web`)

| Route | Page |
| --- | --- |
| `/register` | Register |
| `/verify-email` | Verify / resend |
| `/otp` | OTP verification |
| `/forgot-password` | Forgot password |
| `/reset-password` / `:token` | Reset password |
| `/invite/:token` | Accept invitation |
| `/login` | Login (handles unverified → OTP, locked → lock page) |
| `/session-expired` | Session expired |
| `/account-locked` | Account locked |
| `/unauthorized` | Unauthorized |
| `/app/settings` | Sessions, devices, history, invite teammate |

All use `@hamd/ui` auth screens, real API client (no mocks), responsive + dark-mode capable AuthShell.

## Tests

- `auth-lifecycle.test.ts` - full lifecycle + lockout against in-memory repository
- `auth-reuse.test.ts` - refresh reuse family revoke
- `auth-schemas.test.ts` - password / login device fields
- `route-policy.test.ts` - new auth routes registered
- Existing web auth page smoke tests

## Remaining blockers (non-auth module work)

1. Live Postgres + migrated permissions seed required for browser E2E register (permission keys must exist).
2. Production email requires `RESEND_API_KEY` + `EMAIL_FROM`; otherwise console gateway logs codes/links.
3. Quotations / Notifications / Shipments / Ops Console hosting remain deferred (intentionally blocked until auth was complete).
