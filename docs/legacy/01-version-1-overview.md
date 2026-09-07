# Version 1 Overview

**Product:** Almahbub Procurement Platform  
**Version:** 1.0.0 (final stable legacy release)  
**Status:** Archived reference implementation (Phase RC2)  
**Canonical index:** [`legacy/README.md`](../../legacy/README.md)

## Architecture

Version 1 is a three-process classic SPA + API stack:

```
┌─────────────────────┐     ┌─────────────────────┐
│  client-frontend    │     │  admin-dashboard    │
│  Vite React :5173   │     │  Vite React :5174   │
└─────────┬───────────┘     └─────────┬───────────┘
          │  REST + Socket.IO          │
          └────────────┬───────────────┘
                       ▼
              ┌────────────────┐
              │    backend     │
              │ Express :5000  │
              └───────┬────────┘
                      ▼
              Railway MySQL (mysql2)
```

- Buyer and marketing surfaces share one SPA (`client-frontend`).
- Operations surfaces live in a separate SPA (`admin-dashboard`).
- All persistence and realtime chat go through `backend`.
- Not part of the pnpm/Turborepo workspace used by HAMD Genesis (Version 2).

## Technologies

| Layer | Technology |
| --- | --- |
| Client / Admin UI | React 18, React Router 6, Vite, Tailwind, Radix/shadcn-style components, Zustand, TanStack Query, Framer Motion |
| API | Node.js, Express 4, Socket.IO |
| Auth | JWT (`Authorization: Bearer`), stored in browser `localStorage` |
| Database | MySQL via `mysql2` connection pool |
| Email | Nodemailer (Gmail) and/or Resend |
| Media | Multer + Cloudinary |
| Process (API) | Nodemon in development |

## Database

- **Engine:** MySQL
- **Typical hosts:** Railway public proxy (`*.proxy.rlwy.net`) or local `127.0.0.1:3306`
- **Schema bootstrap:** `backend/config/database.js` → `CREATE TABLE IF NOT EXISTS` plus SQL files under `backend/migrations/`
- **Primary tables:** `users`, `categories`, `products`, `orders`, `order_tracking`, `chat_messages`, `announcements`, `announcement_replies`, `announcement_views`, `announcement_reactions`, `faqs`, `notifications`, `ai_knowledge`, `migrations`, and `services` (used by routes; may be migration/manual)

Procurement “requests” in the UI are persisted largely through the MySQL `orders` table and `/api/v1/requests` + `/api/v1/orders` route pairs.

## Authentication

| Concern | Version 1 behavior |
| --- | --- |
| Mechanism | JWT signed with `JWT_SECRET` |
| Transport | `Authorization: Bearer <token>` |
| Client storage | `client_token` / Zustand persist (`almahbub-client-auth`) |
| Admin storage | `admin_token` / Zustand persist (`almahbub-admin-auth`) |
| Roles | `user` \| `admin` (coarse) |
| Client journeys | Register, email verify, login, forgot/reset password, profile update |
| Admin journey | Dedicated `POST /api/v1/auth/admin/login` |
| Realtime | Socket.IO handshake uses the same JWT (`handshake.auth.token`) |

Cookies are not the primary auth store for Version 1 SPAs.

## Major features

| Area | Client | Admin | Backend |
| --- | --- | --- | --- |
| Marketing homepage & content pages | Yes | - | Static/content via API where needed |
| Catalog (categories / services / products) | Browse | CRUD | `/categories`, `/products`, `/services` |
| Procurement requests | Create / list / detail / cancel | Triage / edit / stats | `/requests`, `/orders` |
| Tracking | Limited via request detail | Trackers CRUD | `/tracker` |
| Announcements | Read / engage | Full CMS | `/announcements` |
| Chat / support | Socket + REST | Socket + REST | `/chat` + Socket.IO |
| Notifications | Inbox | Inbox | Nested under auth/users |
| AI assistant | - | Knowledge + auto-respond | `/ai` |
| Users | Profile | User admin | `/users` |
| Settings | Profile-oriented | Settings page | Partial |

## Known limitations

See [`07-version-1-known-issues.md`](./07-version-1-known-issues.md) for the full debt list. Headline limits:

- Dual SPA + MySQL monolith; no enterprise domain boundaries
- JWT in `localStorage` (XSS exposure)
- Coarse RBAC (`user`/`admin`) without org memberships
- Free-form status edits in ops UI (weak workflow controls)
- Chat and AI coupled into the same API process
- No first-class quotations, invoices, payments, or shipment domain APIs
- Outside monorepo tooling; parallel to HAMD Genesis

## Folder structure

```
backend/                 # v1-backend
  config/                # database, security, cloud storage
  middleware/
  routes/                # Express routers
  socket/                # Socket.IO chat
  services/              # email, AI
  migrations/            # incremental SQL
  scripts/               # seed / migrate helpers
  uploads/
  server.js

client-frontend/         # v1-client
  src/pages/
  src/components/
  src/lib/api.ts
  src/stores/

admin-dashboard/         # v1-admin
  src/pages/
  src/components/
  src/lib/api.ts
  src/stores/
```

## Deployment

| Concern | Version 1 practice |
| --- | --- |
| API host (historical) | Render (`almahbub-procurement.onrender.com` / typo variant in client defaults) |
| API port | `PORT` or `5000` |
| Client / Admin | Vite static builds (hosting separate from API) |
| Database | Railway MySQL via `DB_*` env vars |
| CORS | `ALLOWED_ORIGINS` or `CLIENT_URL`; defaults include `5173` / `5174` in non-production when unset |
| Trust proxy | Enabled for Render-style reverse proxies |
| Secrets | `backend/.env` (never commit); see `backend/.env.example` |

Version 1 is **not** started by root `pnpm dev`. That command starts Version 2 `apps/api` only.

## Related documents

- [`02-migration-map.md`](./02-migration-map.md)
- [`04-api-inventory.md`](./04-api-inventory.md)
- [`05-database-migration-plan.md`](./05-database-migration-plan.md)
- [`06-version-1-release-notes.md`](./06-version-1-release-notes.md)
