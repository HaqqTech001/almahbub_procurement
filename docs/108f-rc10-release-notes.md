# RC10 - Release Notes (Almahbub Enterprise Platform V2)

## Summary

Version 2 (HAMD Genesis) replaces Version 1 as the production procurement platform: enterprise API, buyer workspace, operations console, hardened auth, domain workflows, notifications, shipments, finance primitives, and optional AI procurement copilot.

## Highlights

- **Identity:** register, verify, login, refresh rotation, lockout, sessions/devices, invitations
- **Procurement:** request lifecycle with enforced state transitions
- **Quotations / invoices / payments / shipments:** domain APIs + policies + RBAC
- **Communication:** notifications, preferences, announcements, support chat (REST), guidance
- **Ops console:** dashboard, catalog, POs, finance views, audit, CMS announcements, AI knowledge
- **AI copilot:** provider-backed (OpenAI / Anthropic / Gemini / Azure); no mock completions
- **Security:** Helmet, CORS allowlist, Zod validation, Redis rate limits, dependency audit gate, secret scanning in CI
- **Web quality:** code splitting, self-hosted fonts, WCAG AA e2e, SEO metadata / sitemap / robots

## Breaking vs V1

- Postgres replaces V1 MySQL as SoT
- Socket.IO realtime chat → REST polling model on Genesis (see known issues)
- Admin dashboard → `apps/ops`
- Client SPA → `apps/web`

## Upgrade path

Follow [108a](./108a-rc10-deployment-guide.md). Keep V1 READ ONLY for rollback reference; do not delete.
