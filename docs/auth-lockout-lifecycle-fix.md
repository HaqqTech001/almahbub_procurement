# Temporary authentication lock expiry correction

1. **Root cause.** Backend counted both genuine `failure` and `blocked` login events in a sliding window. Every retry during a lock created another counted blocked event, moving the window forward. Successful sign-in events did not reset the queried failure history. Independently, both apps used the same browser-wide localStorage failure-counter key, checked that before session restoration, and retained a React `locked` status without an expiry timer. HTTP 429 was also classified as account lock. The locked screens offered no automatic recovery. Cross-origin responses did not expose Retry-After.

2. **Threshold.** Unchanged: configuration default `AUTH_LOCKOUT_THRESHOLD=5` genuine failed passwords. Configurable 3?20. Existing service fixtures use three to exercise configuration. Deployed environment overrides were not inspected.

3. **Duration.** Unchanged: default `AUTH_LOCKOUT_WINDOW_SECONDS=900` (15 minutes). Configurable 60?86400 seconds. A threshold sequence must fit inside that window; its final genuine failure anchors the cooldown. Blocked retries do not move that deadline. At `lockedUntil <= now`, correct credentials are usable and new wrong credentials start a fresh sequence.

4. **Storage.** Existing PostgreSQL `login_events` is authoritative; no persisted Boolean lock or separate failed-count column. Only `sign_in_failed/failure` events after the last `sign_in/success` count. Existing audit history is preserved. Both apps cache only an API-provided deadline in separate sessionStorage keys for presentation; deleting or changing browser storage cannot unlock an account on the server. Legacy browser-only counters are retired automatically by application code.

5. **Redis.** No account lock state is stored in Redis. Redis separately limits authentication requests by IP (20 per 15 minutes) using sorted sets and `PEXPIRE(windowMs)`. Its rolling TTL is renewed by requests, but old entries are pruned on access. This can produce HTTP 429 after account cooldown expiry; it is correctly presented as request throttling and never converted to ACCOUNT_LOCKED.

6. **Affected layers.** Backend event selection and reset semantics, frontend state lifecycle, and error classification caused the issue. PostgreSQL `timestamptz` stores absolute instants. The correction uses database `clock_timestamp()` and timestamps writes after row-lock waits, avoiding transaction-start-time ordering errors. Browser clocks affect the advisory countdown only; explicit sign-in always rechecks the server.

7. **Exact files touched for this task.** Earlier business/media/UI edits elsewhere in the workspace are outside this fix. Web StatusPages preserves its pre-existing unrelated status-page changes.

- `apps/api/src/app.ts`
- `apps/api/src/lib/app-error.ts`
- `apps/api/src/middleware/error-handler.ts`
- `apps/api/src/modules/identity/auth/application/auth-service.ts`
- `apps/api/src/modules/identity/auth/application/password-lockout.ts`
- `apps/api/src/modules/identity/auth/application/password-lockout.test.ts`
- `apps/api/src/modules/identity/auth/application/auth-lifecycle.test.ts`
- `apps/api/src/modules/identity/auth/application/google-signin.test.ts`
- `apps/api/src/modules/identity/auth/infrastructure/auth-repository.ts`
- `apps/api/src/modules/identity/auth/infrastructure/password-lockout-repository.test.ts`
- `apps/web/src/auth/api/auth-errors.ts`
- `apps/web/src/auth/guards/RequireAuth.tsx`
- `apps/web/src/auth/pages/LoginPage.tsx`
- `apps/web/src/auth/pages/StatusPages.tsx`
- `apps/web/src/auth/pages/account-lock-expiry.test.tsx`
- `apps/web/src/auth/session/AuthProvider.tsx`
- `apps/web/src/auth/session/client-rate-limit.ts`
- `apps/web/src/auth/session/client-rate-limit.test.ts`
- `apps/web/src/auth/session/auth-failure-isolation.test.tsx`
- `apps/ops/src/auth/api/auth-errors.ts`
- `apps/ops/src/auth/guards/RequireAuth.tsx`
- `apps/ops/src/auth/pages/LoginPage.tsx`
- `apps/ops/src/auth/pages/StatusPages.tsx`
- `apps/ops/src/auth/pages/account-lock-expiry.test.tsx`
- `apps/ops/src/auth/session/AuthProvider.tsx`
- `apps/ops/src/auth/session/client-rate-limit.ts`
- `apps/ops/src/auth/session/client-rate-limit.test.ts`
- `apps/ops/src/auth/session/auth-failure-isolation.test.tsx`
- `apps/web/src/auth/session/auth-session.test.ts`
- `packages/ui/src/auth/screens/StatusScreens.tsx`
- `docs/auth-lockout-lifecycle-fix.md`

8. **Migration.** None. No database rows were manually cleared, no accounts manually unlocked, no Redis keys flushed, and no schema change is required.

9. **Tests.** API authentication suite: 50 passing tests across 12 files. Web authentication suite: 57 passing tests across 12 files. Ops authentication suite: 29 passing tests across eight files. New tests cover below-threshold attempts, threshold anchoring, active lock auditing, exact expiry, expired correct/wrong passwords, success reset, timezone offsets, database query filtering and serialization, stale browser state, reload recovery, Web/Ops automatic route recovery, refresh 403, network and HTTP 500 errors, and IP 429. Web additionally tests Google failure isolation; Ops does not implement Google login. Existing Google and refresh service tests remain passing. Repository tests use a transaction mock, not a live multi-instance database.

10. **Builds.** API TypeScript build passes. Shared UI, Web and Ops production builds pass. Logs: build/auth-api-build.log, build/auth-ui-build.log, build/auth-web-build.log, build/auth-ops-build.log. Initial stale shared declarations were resolved by building UI first. A transient unrelated catalog script type error appeared during concurrent workspace changes; the final API build passed without edits to that script in this task.

11. **Refresh 403 isolation.** Refresh never calls the password-attempt repository method. Browser provider regression tests confirm refresh 403 and page bootstrap do not submit passwords or set account lock state. Other transport failures do not create client failure counters.

12. **Successful authentication reset.** Password sign-in and Google sign-in/session completion write `sign_in/success`, which is the reset boundary for subsequent password checks. Google OTP linking ends through that same successful sign-in path. Standalone email-verification OTP does not establish an authenticated session. Successful client session application clears cached cooldown state. Session refresh does not erase server-side failed-password audit history or act as a password-lock bypass.

13. **Automatic recovery and enumeration.** React timers and focus handlers clear expired advisory state. Both locked routes return to sign-in at expiry or when reloaded with an expired/missing deadline. A minutes:seconds countdown and Return to sign in are shown during cooldown; contact support is secondary (Web contact route; Ops existing public contact email). Sign-in performs the actual server authorization check. No arbitrary-email lock-status endpoint was added. Invalid passwords, including attempts during an active lock, retain generic INVALID_CREDENTIALS; ACCOUNT_LOCKED plus Retry-After is returned only after verifying the password. This avoids exposing account existence through a new lock-status response. CORS exposes Retry-After to allowed clients.

14. **Production implications.** PostgreSQL user-row locks serialize password checks and failed-event writes across API instances; successful sign-in event writes acquire the same lock. DB time and persisted events survive Render restarts and do not require sticky sessions or a process-local account cache. Redis IP fallback remains per-process when Redis is unavailable, so distributed IP protection still depends on configuring Redis; account protection remains PostgreSQL-backed in either case. No new Redis keys or non-expiring cache locks are introduced. Cookies and CSRF/session contracts are unchanged. Bootstrap still restores valid sessions even with a stale UI cooldown. Existing genuine failures remain enforceable after deployment, but historic blocked retries no longer prolong them. Deploy API and both clients together for complete error/expiry behavior. Live production database/Redis and cross-instance load testing were not performed.

15. **Git status.** Changes remain uncommitted and unpushed. The workspace already contained substantial unrelated tracked and untracked work. A full status snapshot is saved at build/auth-git-status.txt; no staging, commit, reset, or push was performed.
