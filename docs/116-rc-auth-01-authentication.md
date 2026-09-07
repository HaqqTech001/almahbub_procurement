# RC-AUTH-01 - Complete production authentication migration

**Status:** Implemented and verified (STOP - no next module).  
**Date:** 2026-08-09

## 1. Authentication architecture

Genesis buyer auth (not a parallel system):

```
apps/web (@hamd/client alias)
  AuthProvider → memory access JWT + sessionHint
  httpOnly refresh cookie (hamd_refresh) + CSRF (hamd_csrf / body csrfToken)
       │
       ▼
apps/api /api/v1/auth
  AuthService + AuthRepository (Prisma/Postgres)
  authenticate middleware → membership + RBAC permissions
```

UI screens live in `@hamd/ui/auth`. Pages in `apps/web/src/auth/pages/*` call typed `auth-client.ts`.

## 2. V1 → V2 parity

| Capability | V1 | V2 |
| --- | --- | --- |
| Buyer email/password login | Yes | Yes |
| Register + org creation | Yes | Yes |
| Email verification | Token link | Token link + OTP |
| Resend verification | Stub | Real API |
| Forgot / reset password | Yes | Yes |
| Profile update | Yes | `/app/profile` + PATCH `/profile` |
| Change password | API weak UI | `/app/settings` |
| Session persist | localStorage JWT | httpOnly refresh + memory access |
| Server logout / revoke | No | Yes (+ logout everywhere) |
| Sessions / devices / history | No | Yes |
| Google OAuth | Dead UI only | Real OAuth (env-gated) |
| OTP / MFA | No | Email OTP (verify); MFA placeholder only |

## 3. API endpoints used

Public: register, login, refresh, forgot/reset password, verify-email, otp/verify, otp/resend, google/status, google, google/callback, invitations…

Authenticated: me, profile, password, logout, logout-everywhere, sessions, devices, login-history, invitations, validate.

## 4. Frontend routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in (+ Google when configured) |
| `/login/oauth/complete` | Finish Google session via refresh |
| `/register` | Registration → `/otp` |
| `/verify-email`, `/otp` | Verification |
| `/forgot-password`, `/reset-password` | Recovery |
| `/app`, `/app/profile`, `/app/settings`, … | Workspace |

## 5. Google OAuth status

**Implemented** as authorization-code flow against `UserIdentityProvider`.

Required env (API):

```
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://127.0.0.1:4000/api/v1/auth/google/callback
APP_PUBLIC_URL=http://127.0.0.1:3000
```

Google Cloud Console must allow that redirect URI.  
Until configured, `GET /auth/google/status` returns `{ enabled: false }` and **no fake button** is shown.

## 6. Session architecture

- Access JWT: memory only (`token-store`)
- Refresh: httpOnly cookie, rotated, reuse detection
- CSRF on refresh
- Bootstrap: sessionHint / fresh access → refresh → `/me`
- Prefer same-site `127.0.0.1` for web + API (or empty `VITE_API_URL` + Vite proxy)

## 7. Protected-route solution

`RequireAuth`: anonymous → `/login?returnTo=…` (not Unauthorized).  
Ops `/unauthorized` remains for authenticated non-ops users only.

## 8. Root cause of prior Unauthorized

Historical: anonymous `/app` redirected to Unauthorized (fixed RC-POLISH-01).  
Remaining risks: failed refresh (cookie/CORS/host mismatch), ops permission gate, or API 401 banners inside `/app`.

## 9. Files changed (primary)

- API: `google-oauth.ts`, `auth-service`, `auth-controller/routes`, `auth-repository` (OAuth + tx timeouts), `auth-email` (dev console OTP), `env`, `route-policy`
- UI: `LoginScreen` / `RegisterScreen` Google CTA, `auth.css` mobile overflow, sign-out danger styling
- Web: `LoginPage`, `RegisterPage`, `OAuthCompletePage`, `ProfilePage`, `App` routes, `WorkspaceShell` profile links, `auth-client` Google helpers
- Tests: `google-oauth.test.ts`, `e2e/rc-auth-01-authentication.spec.ts`
- Docs: this file

## 10. Browser test results

| Step | Result |
| --- | --- |
| Register | Pass (after tx timeout + console email fix) |
| Verify OTP | Pass |
| Login → `/app` | Pass |
| Navigate protected `/app/requests` | Pass |
| Refresh while authenticated | Pass |
| Logout → `/app` → `/login` | Pass (account menu Sign Out) |
| Google Sign-In | Env not configured in this workspace - status endpoint returns disabled; no fake button |
| Auth pages mobile overflow 390 | Pass (overflow 0) |
| Playwright `rc-auth-01` | Pass |

## 11–13. Quality gates

- API typecheck / auth tests: Pass  
- Web typecheck / lint / auth-related unit tests: Pass  
- UI build: Pass  
- Playwright RC-AUTH-01: Pass  

## 14. Remaining environment requirements

1. `GOOGLE_OAUTH_CLIENT_ID` / `SECRET` / `REDIRECT_URI` for live Google Sign-In  
2. Production: `RESEND_API_KEY` + `EMAIL_FROM` (dev defaults to console OTP sink; set `AUTH_EMAIL_PROVIDER=resend` to exercise Resend locally)  
3. Keep `CORS_ORIGINS` aligned with the SPA origin; avoid `localhost` vs `127.0.0.1` mismatch  
4. Supabase latency: auth transactions use 20s timeout  

## STOP

Authentication migration for this sprint is complete for review. Do not start the next module until accepted.
