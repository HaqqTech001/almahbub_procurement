# Phase 4 - Authentication Experience

**Package:** `@hamd/ui/auth` (+ `@hamd/ui/auth.css`)  
**Rule:** Preserve business logic. Presentational UI with injected handlers.

## Audit

See [69-phase-4-authentication-experience-audit.md](./69-phase-4-authentication-experience-audit.md).

| Screen | Classification |
| --- | --- |
| Login | REFACTOR |
| Register | REFACTOR |
| Email / OTP / Forgot / Reset / Password changed / Resend | REFACTOR |
| Session expired / Unauthorized / Forbidden / Locked / Invite / MFA placeholder | NEW |
| AuthSlider collage / localStorage JWT | REPLACE |

## Import

```ts
import { LoginScreen, authLazyScreens } from "@hamd/ui/auth";
import "@hamd/ui/auth.css";

// Code-split example
const Login = lazy(() =>
  authLazyScreens.LoginScreen().then((m) => ({ default: m.LoginScreen })),
);
```

## Handler contract

Screens do **not** call the API directly. Host apps inject:

- `LoginScreen.onSubmit({ email, password, rememberMe })` → `POST /api/v1/auth/login`
- Register / forgot / reset / OTP / invite → wire when API routes land; UI field models match legacy KEEP contracts

## Features shipped

- Premium split layout + SVG illustration system
- Floating labels, password toggle, caps-lock, strength meter
- Remember me, autofocus, OTP paste + auto-advance, countdown / resend
- Dark mode (`prefers-color-scheme` + `[data-theme="dark"]`)
- Reduced motion (`prefers-reduced-motion` + Framer Motion gate)
- Loading skeletons, error / success alerts, ARIA, skip link, SEO `documentTitle` hint
- Storybook: `pnpm --filter @hamd/ui storybook`
- Tests: `pnpm --filter @hamd/ui test`

## Reviews

See [70-phase-4-authentication-reviews.md](./70-phase-4-authentication-reviews.md).
