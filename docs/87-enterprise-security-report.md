# HAMD Genesis - Enterprise Security Report

**Review date:** 2026-08-05  
**Scope:** Authentication · Authorization · RBAC · CORS · Headers · Cookies · Sessions · CSRF · XSS · SQL Injection · Rate Limiting · Uploads · Secrets  
**Verdict:** Verified issues remediated in this pass. Remaining items are documented host/ops debt, not silent gaps.

---

## Executive summary

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Hardened | Argon2id, timing-parity login, JWT access + opaque refresh |
| Authorization / RBAC | Pass | Bearer auth + `requirePermission`; org-scoped queries |
| CORS | Pass | Allowlist + credentials; empty-origin allowed for non-browser clients |
| Headers | Hardened | Helmet + production HSTS + `no-referrer` |
| Cookies | Hardened | httpOnly refresh, Secure (prod/`COOKIE_SECURE`), SameSite=strict |
| Sessions | Hardened | Rotation + **family revoke on refresh reuse** |
| CSRF | Hardened | Double-submit cookie on refresh; utf8-safe `timingSafeEqual` |
| XSS | Hardened | Email preview variable HTML escaping |
| SQL Injection | Pass | Prisma parameterized; readiness uses tagged `$queryRaw` |
| Rate Limiting | Hardened | Auth IP limiter + trust proxy + bucket cap |
| Uploads | Policy ready | No upload routes yet; `uploadSecurityPolicy` + validator added |
| Secrets | Hardened | Prod JWT entropy/placeholder rejection; logger redaction expanded |

---

## Verified issues fixed

### High
1. **Refresh-token reuse did not kill the family** - Replaying a rotated refresh only failed the request; active siblings in the family could remain valid.  
   **Fix:** Detect prior revoked hash → `revokeSessionFamily`; concurrent rotate failure also revokes family (`auth-service` / `auth-repository`).

2. **Login timing oracle** - Missing users skipped Argon2 verify.  
   **Fix:** Constant-time path verifies against a dummy Argon2id hash when credentials are absent/invalid algorithm.

3. **Email preview XSS** - `renderEmailTemplate` injected raw `{{var}}` values into `dangerouslySetInnerHTML`.  
   **Fix:** HTML-escape substituted values by default (`escapeHtml`).

### Medium
4. **Rate limit IP behind proxies** - Without `trust proxy`, all clients could share one key.  
   **Fix:** `TRUST_PROXY` env + `app.set("trust proxy", …)`.

5. **Helmet defaults for API** - Production HSTS not explicit; referrer policy not pinned.  
   **Fix:** Helmet configured with production HSTS, `referrerPolicy: no-referrer`, CSP disabled for JSON API.

6. **CSRF compare edge case** - String-length then `Buffer.from` could throw on byte-length mismatch.  
   **Fix:** UTF-8 buffers + byte-length check before `timingSafeEqual`.

7. **Weak/placeholder JWT in production** - Min length alone accepted example secrets.  
   **Fix:** Production refine rejects known placeholders and low unique-character entropy.

8. **Logger redaction gaps** - Password-adjacent fields / Set-Cookie incomplete.  
   **Fix:** Expanded pino `redact` paths.

9. **Auth controller missing auth → raw Error** - Could surface as 500.  
   **Fix:** Throw `AppError` `UNAUTHENTICATED`.

10. **RBAC time-bound roles** - Only `endsAt: null` roles applied (fail-closed but incorrect).  
    **Fix:** Include roles with `endsAt > now`.

11. **`$queryRawUnsafe("SELECT 1")`** - Unnecessary unsafe API.  
    **Fix:** Tagged `$queryRaw\`SELECT 1\``.

12. **Rate-limit Map unbounded** - Memory growth under spoofed IPs.  
    **Fix:** Cap stored keys (~10k).

### Low / readiness
13. **Uploads** - No multipart endpoints exist; added `uploadSecurityPolicy` + `validateUploadCandidate` for future media/CMS routes.  
14. **Cookie Secure override** - `COOKIE_SECURE` env for explicit control behind TLS terminators.

---

## Control matrix (post-fix)

| Control | Implementation |
| --- | --- |
| AuthN | Email/password → Argon2id; access JWT (HS256, iss/aud/exp/ver); refresh opaque, hashed at rest |
| AuthZ | `createAuthenticate` + `requirePermission(permission)`; services filter by `context.organizationId` |
| RBAC | Membership roles → permission keys in `AuthContext` |
| CORS | `CORS_ORIGINS` allowlist, `credentials: true` |
| Headers | Helmet, HSTS (prod), no-referrer, `x-powered-by` disabled |
| Cookies | `hamd_refresh` httpOnly; `hamd_csrf` readable; path `/api/v1/auth`; SameSite=strict |
| Sessions | Rotate on refresh; reuse → family revoke; logout revokes session |
| CSRF | Required on `/auth/refresh` via cookie ↔ `x-csrf-token` |
| XSS | JSON-LD stringify; email vars escaped; React text defaults elsewhere |
| SQLi | Prisma only; no user-concatenated SQL |
| Rate limit | Login/refresh 20 / 15 min / IP (`AUTH_RATE_LIMITED`) |
| Uploads | Policy module; enforce when routes land |
| Secrets | `.env` gitignored; examples placeholders; prod JWT strength gate; gitleaks CI |

---

## Documented remaining debt

1. **Distributed rate limits** - In-process limiter is per-node; edge/Redis shared quotas still required in multi-replica prod.  
2. **Upload endpoints** - Policy exists; wire MIME magic, signed PUT, and malware scan when CMS/media APIs ship.  
3. **CSP for browser hosts** - API disables CSP (JSON); public web apps must set their own strict CSP.  
4. **Legacy `backend/`** - Outside Genesis gates; do not treat as production authority.  
5. **Account lockout / MFA step-up** - Architecture documented; not fully productized on all sensitive finance actions yet.

---

## Verification

```bash
pnpm --filter @hamd/api typecheck
pnpm --filter @hamd/api test
pnpm --filter @hamd/ui exec vitest run src/email-center/email-center.test.tsx
```

New/updated coverage: refresh reuse family revoke, upload policy validator, email HTML escape, rate-limit behavior.

---

## STOP

Enterprise security review complete; verified issues fixed; debt documented.
