# Phase 4 - Authentication Experience Audit

**Module:** Authentication Experience  
**Rule:** Preserve business logic. Modernize experience. Zero omission.

---

## Classification

| Screen / capability | Decision | Why |
| --- | --- | --- |
| Login (email/password, session cookies) | **REFACTOR** | API `POST /auth/login` works - rebuild premium UI; keep credential contract |
| Refresh / logout / me / profile | **KEEP** | Session business logic intact in `apps/api` |
| Register (multi-step company fields) | **REFACTOR** | Legacy fields KEEP; API route GAP - UI presentational until API lands |
| Email verification | **REFACTOR** | Token journey KEEP; API GAP - UI + resend contract ready |
| OTP verification | **REFACTOR** → **NEW UI** | Schema/`otplib` ahead of product; ship paste/auto-focus OTP UI |
| Forgot password | **REFACTOR** | Journey KEEP; API GAP |
| Reset password | **REFACTOR** | Journey KEEP; strength UX modernize |
| Password successfully changed | **REFACTOR** | Success state was weak - dedicated premium screen |
| Resend verification | **REFACTOR** | Legacy stubbed - real countdown + handler props |
| Session expired | **REPLACE** gap → **NEW** | Required enterprise state |
| Unauthorized (401) | **REPLACE** gap → **NEW** | Required |
| Forbidden (403) | **REPLACE** gap → **NEW** | Required |
| Account locked | **REPLACE** gap → **NEW** | Required; wire when lockout API exists |
| Invitation acceptance | **REFACTOR** gap → **NEW UI** | DB `OrganizationInvitation` exists; UI now |
| MFA placeholder | **KEEP** (future) | Placeholder screen; no fake MFA |
| Legacy AuthSlider collage | **REPLACE** | Professional SVG illustration system |
| localStorage JWT pattern | **REPLACE** | Keep httpOnly refresh cookies from new API |
| Social login placeholders | **REPLACE** | Not in scope; omit |

**Business logic preserved:** login credentials shape, register field model, verify/reset token URLs, remember-me as client preference (not weakening server sessions).

---

## STOP (audit)

Implementation proceeds with presentational `@hamd/ui/auth` screens + handlers injected by host apps.
