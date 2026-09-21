# Authentication throttle review — 2026-09-17

No commits, pushes, deployments, database mutations, Redis flushes or environment-file edits were performed for this fix. Existing unrelated working-tree changes were preserved.

## Root cause and evidence

Web and Ops `formatAuthError` previously converted **any HTTP 429** with a `Retry-After: 50` header into exactly `Too many attempts. Try again in 50 seconds.` That text does not identify an account lock or even which backend limiter fired.

Two independently reproduced scope defects existed:

- `app.use(API_V1_PATH, limiters.api)` shared one 300-request/60-second IP bucket across catalogue, wedding, authentication and other API calls. A regression test makes 300 unrelated requests at time T, then sends its **first** password request at T+10 seconds: the old limiter responds `429 API_RATE_LIMITED`, `Retry-After: 50`.
- One 20-request/15-minute auth IP bucket covered password login, background `/refresh`, registration, Google, verification and password recovery. Page restoration could exhaust password-request allowance without submitting any password. A regression test exhausts background/other operations and confirms the first password request reaches its handler under the corrected scopes.

Local configuration inspection, without printing secrets: development, `TRUST_PROXY=0`, Redis not configured, account threshold 5, account window 900 seconds. The historical browser response envelope/request trace was not supplied, so the particular September 17 response cannot honestly be attributed to one of those two counters from its text alone. Both defects are corrected; the exact 50-second API reproduction is verified in isolated tests.

## Request limits after the fix

| Protection | Key | Maximum/window |
| --- | --- | --- |
| Password traffic | `rl:auth:v2:password-login:<Express client IP>` | 20 admitted requests / rolling 900 seconds |
| Refresh traffic | `rl:auth:v2:session-refresh:<IP>` | 20 / 900 seconds, independent of passwords |
| Google, verification, recovery, registration, invitations | Same namespace with a stable operation group | 20 / 900 seconds per group/IP |
| General API traffic | `rl:api:v2:general:<IP>` | 300 / rolling 60 seconds |
| Auth API traffic | `rl:api:v2:auth:<operation>:<IP>` | 300 / rolling 60 seconds, isolated from other operations and general API |

Memory uses the same selected keys without the Redis namespace. Both Web and Ops password requests use the same password/IP ceiling: changing email or application cannot bypass it. Case variants and trailing slashes map to the same operation. IPv4-mapped IPv6 addresses are normalized. Tokens, query strings and arbitrary forwarded headers do not form keys.

An admitted request counts toward its endpoint's traffic budget regardless of eventual HTTP status; this is distinct from a failed-password event. A 500 login response can therefore consume one request allowance, but **does not become an account credential failure**. OPTIONS never consumes a limiter budget. CORS preflight terminates before the app limiters as well.

Memory expires timestamps at the exact rolling-window boundary; rejected requests do not add timestamps. Redis now uses one atomic Lua script and Redis server time. It removes expired entries, checks the count **before** insertion, derives Retry-After from the oldest admitted request, and renews TTL only after admitting a request. Blocked retries no longer extend the lock indefinitely. No milliseconds/seconds conversion is inferred from TTL: retry seconds are explicitly rounded up from milliseconds.

When Redis is configured it remains the distributed authority. The existing memory fallback is retained and now kept warm by admitted traffic, avoiding a fresh local allowance immediately after a Redis outage. It remains per-process during an outage, not a replacement distributed guarantee. Memory resets on process restart; Redis survives API restarts. The corrected operation namespaces do not read old shared-scope keys; old keys expire naturally. No keys were manually cleared. Actual Redis integration was not run because no isolated Redis server was available; adapter behavior is tested with mocked Redis responses and the Lua control flow was reviewed.

The unchanged password/IP ceiling can still legitimately throttle a shared network after 20 actual password requests. Its message now describes network request limiting rather than claiming that the individual account failed authentication. No localhost or email exemptions were added.

## Account lock — separate and unchanged

- Storage: PostgreSQL `login_events`, scoped by `user_id`; no `users.status` mutation or persisted `lockedUntil` column is required.
- Threshold/window: configured `AUTH_LOCKOUT_THRESHOLD` / `AUTH_LOCKOUT_WINDOW_SECONDS`; local/default 5 failures within 900 seconds.
- Duration: until the last genuine failure completing the threshold sequence plus 900 seconds. PostgreSQL's clock is authoritative.
- Only `login()` after password verification calls `checkPasswordAttempt`. Wrong passwords produce `sign_in_failed` / `failure`; blocked retries are audit-only `blocked` events and cannot prolong the lock.
- Unknown accounts receive generic invalid-credentials responses. The lock response is `423 ACCOUNT_LOCKED` only after the correct password is verified; wrong passwords do not reveal account existence or lock state.
- Successful authentication records `sign_in` / `success`; earlier failures no longer count. Per-user row locks serialize failure checks and successful-event resets.
- At exact expiry, the derived lock is null; authentication resumes without deleting events or manually unlocking a database record.
- Refresh (missing/expired/revoked), Google/configuration/popup errors, OTP delivery, page loads, network/CORS errors, catalogue/wedding failures and database/internal errors never enter the password-failure branch. Existing tests plus new shared-IP/error-isolation tests verify this separation.

## Web and Ops

429 request cooldowns are nonpersistent UI state with a Retry-After countdown. The form is guarded while waiting and re-enables automatically. No reload or account-locked redirect occurs. A Google request throttle uses an independent countdown so password sign-in remains available. Only explicit `423 ACCOUNT_LOCKED` produces the account-lock state.

Existing account-lock screens retain the server-provided deadline, automatically return to login at expiry, and recheck authority through the next interactive login, never through an email-existence endpoint. Legacy browser-wide failed-login counters are already retired. StrictMode/remount tests verify restoration does not submit credentials.

## Proxy audit

Express still defaults to trusting no proxy (`TRUST_PROXY=0`). Localhost uses the socket identity; forged `X-Forwarded-For` does not change rate keys. Configured positive numeric trust uses Express's existing nearest-hop algorithm; a test with one trusted hop confirms a spoofed leftmost entry cannot change the nearest client identity.

The actual hosted Render environment/ingress chain is not available in this workspace. Do not infer a hop count from the Render name, blindly enable `trust proxy=true`, or trust an arbitrary forwarded value. A numeric hop configuration is safe only if every ingress path has that topology and the trusted proxy supplies/sanitizes forwarding headers. With trust zero behind a proxy, all users may still share the proxy IP. Verify the deployed path (including Cloudflare and any alternate/direct access) before changing deployment configuration. No production proxy configuration was changed.

Primary reference: [Express behind proxies](https://expressjs.com/en/guide/behind-proxies/).

## Validation commands

```powershell
corepack pnpm --filter @hamd/ui build
corepack pnpm --filter @hamd/api exec vitest run src/middleware/auth-throttling.test.ts src/middleware/rate-limit.test.ts src/modules/identity/auth/application/auth-lifecycle.test.ts src/modules/identity/auth/application/password-lockout.test.ts src/modules/identity/auth/infrastructure/password-lockout-repository.test.ts src/modules/identity/auth/application/google-signin.test.ts --testTimeout=30000 --maxWorkers=1
corepack pnpm --filter @hamd/web exec vitest run src/auth/pages/LoginPage.throttle.test.tsx src/auth/session/auth-failure-isolation.test.tsx src/auth/session/client-rate-limit.test.ts
corepack pnpm --filter @hamd/ops exec vitest run src/auth/pages/LoginPage.throttle.test.tsx src/auth/session/auth-failure-isolation.test.tsx src/auth/session/client-rate-limit.test.ts
corepack pnpm --filter @hamd/api typecheck
corepack pnpm --filter @hamd/api build
corepack pnpm --filter @hamd/web typecheck
corepack pnpm --filter @hamd/web build
corepack pnpm --filter @hamd/ops typecheck
corepack pnpm --filter @hamd/ops build
git diff --check
```

Tests use isolated memory repositories, mocked providers/Redis and local HTTP fixtures. No hosted Supabase/Redis data is used. Initial concurrent runs hit test timeouts; serial API execution avoids competing password-hashing workloads. No migration is required.

Final results: 33 focused API tests, 16 Web tests and 14 Ops tests passed. API/Web/Ops typechecks and builds passed; shared UI build passed. Changed authentication files passed ESLint. Ops build emitted CSS minifier warnings outside this authentication change. `git diff --check` passed.

## Files changed for this authentication fix

```text
apps/api/AUTH-THROTTLING-REVIEW.md
apps/api/src/middleware/auth-rate-limit-scope.ts
apps/api/src/middleware/auth-throttling.test.ts
apps/api/src/middleware/rate-limit.ts
apps/api/src/middleware/redis-rate-limit.ts
apps/api/src/modules/identity/auth/api/auth-routes.ts
apps/api/src/modules/identity/auth/application/auth-lifecycle.test.ts
apps/web/src/auth/api/auth-errors.ts
apps/web/src/auth/pages/LoginPage.tsx
apps/web/src/auth/pages/LoginPage.throttle.test.tsx
apps/web/src/auth/session/auth-failure-isolation.test.tsx
apps/ops/src/auth/api/auth-errors.ts
apps/ops/src/auth/pages/LoginPage.tsx
apps/ops/src/auth/pages/LoginPage.throttle.test.tsx
apps/ops/src/auth/session/auth-failure-isolation.test.tsx
packages/ui/src/auth/index.ts
packages/ui/src/auth/screens/LoginScreen.tsx
packages/ui/src/auth/useRequestCooldown.ts
```
