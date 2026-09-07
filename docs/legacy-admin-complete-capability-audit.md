# Legacy admin complete capability audit

Evidence sources (V1, read-only):

- UI: `admin-dashboard/src/App.tsx`, `admin-dashboard/src/components/layout/Layout.tsx`
- Pages: `UsersPage`, `RequestsPage`, `RequestDetailPage`, `CategoriesPage`, `ProductsPage`, `AnnouncementsPage`, `CreateAnnouncementPage`, `EditAnnouncementPage`, `ChatPage`, `NotificationsPage`, `TrackersPage`, `AIAssistantPage`, `DashboardPage`, `SettingsPage`, `OrdersPage`
- API: `backend/routes/*.js`, `backend/middleware/auth.js`

V1 authorization was `role === 'admin'` (`requireAdmin`). V2 maps that to `ops:access` plus the existing permission catalog. V1 had no organizations, LOB, or permission catalog.

Status values:

- **Present** — V2 already had an equivalent
- **Improved** — V2 equivalent is stronger than V1
- **Restored** — recovered in this phase
- **Missing** — evidenced in V1, still absent, not invented here
- **Not restored** — evidenced in V1, deliberately not copied

## Capability matrix

| Module | V1 Admin Capability | V1 Evidence | V2 Equivalent | V2 Status | Required Action |
|---|---|---|---|---|---|
| A. User Management | List users with pagination, search, role filter | `backend/routes/users.js` GET `/`; `UsersPage.tsx` | `GET /api/v1/ops/identity`; Ops Users | Improved | Keep. V2 adds org, membership, request counts |
| A. User Management | Client-side status filter; inferred from `email_verified` | `UsersPage.tsx` maps `email_verified` → active/inactive | `UserStatus` + `userStatus` query | Restored / Improved | Real statuses, not email-verified flags |
| A. User Management | View user detail modal (name, email, company, role, request count) | `UsersPage.tsx` modal | Ops user detail drawer | Improved | Keep |
| A. User Management | Change role `user` / `moderator` / `admin` | `PUT /users/:id` `{ role }`; UI dropdown | Grant/revoke `ops_admin` via membership roles | Restored / Improved | Never expose `role=admin` from the browser |
| A. User Management | Set status active / inactive / suspended | `PUT /users/:id` `{ status }` mapped to `email_verified` | `PATCH .../status` `{ command }` | Restored / Improved | Persist `UserStatus`; revoke sessions |
| A. User Management | Hard-delete user; cannot delete self or users with orders | `DELETE /users/:id`; `UsersPage` confirm | Deactivate (`UserStatus.deactivated`) | Not restored (delete) / Restored (disable) | Deactivate keeps data; activate restores |
| A. User Management | Edit profile fields (email, name, company, phone) | API allowed; UI Edit button unwired | Buyer/ops “My account” self-service | Not restored | V1 UI never called it. Users edit their own profile |
| A. User Management | Add User / Filter / Download buttons | Present in `UsersPage` with no handlers | Search/filter exist; no admin create-user | Not restored | Unwired V1 chrome is not a capability |
| A. User Management | Moderator role | API enum only; no distinct middleware | None | Not restored | No V1 permission set beyond the string |
| A. User Management | Password reset by admin | Not found in admin users API | User self-service forgot/reset password | Not restored | V1 had no admin-forced reset |
| A. User Management | Email verification by admin | `emailVerified` on PUT; UI unused | `pending_verification` cannot be skipped | Improved | Activation cannot skip verification |
| B. Procurement / Requests | List/filter requests; open detail | `RequestsPage`, `RequestDetailPage`; `backend/routes/requests.js` | Ops Requests + command machine | Improved | Keep Genesis engine |
| B. Procurement / Requests | Free-form status PUT | `PUT /requests/:id` | `adminRequestCommands` state machine | Improved | Do not restore free-form status |
| B. Procurement / Requests | Approve / reject / processing | V1 status strings | `approve`, `decline`, `start_purchase`, `accept_for_sourcing` | Present | Keep |
| B. Procurement / Requests | Assignment, documents, customer fields | Request detail + files | Assignments, StoredDocument, org/LOB | Present / Improved | Keep |
| C. Orders | Orders routes duplicate requests | `backend/routes/orders.js`; `OrdersPage` unused in nav | Procurement requests | Not restored | Duplicate engine |
| D. Quotations | None in V1 admin | No quotation routes | Ops Quotations + buyer accept/decline | Present (V2-native) | Keep; not a V1 recovery |
| E. Announcements | Create / edit / delete | Admin pages + `backend/routes/announcements.js` | Ops CMS | Present | Keep |
| E. Announcements | Draft / published / scheduled | V1 status + `scheduled_for` | `draft` / `published` / `archived` + `scheduledFor` | Restored / Improved | Schedule is a timestamp, not a status string |
| E. Announcements | Pin | `pinned` column + UI toggle | `Announcement.pinned` | Restored | Public list orders pinned first |
| E. Announcements | Expiry | `expires_at` | `Announcement.expiresAt` | Restored | Public reads hide expired |
| E. Announcements | Media attach (image/video/file) | `media_files` JSON + multer | `AnnouncementMedia` → `StoredDocument` | Present | Keep; no second store |
| E. Announcements | Target audience / type / tags / priority | Announcement form | Not modeled | Not restored | V2 public slider is global; no V2 audience taxonomy |
| E. Announcements | Replies/comments with media | `POST/GET /announcements/:id/replies` | None | Not restored | V2 support threads cover operator↔buyer chat; comments would be a new social domain |
| E. Announcements | #Hamd'26 campaign | Not a V1 CMS row | `apps/web/src/content/campaigns.ts` | Present | CMS cannot edit it |
| F. Media | Category image upload 5MB jpeg/png/gif/webp | `backend/routes/categories.js` multer | No category image column | Not restored | Product/catalog media covers merchandising |
| F. Media | Product image/gallery | Products API | Product images/videos + catalog media policy | Improved | Keep International vs IE isolation |
| F. Media | Chat file attach 10MB | `backend/routes/chat.js` | Support attachments via StoredDocument | Present | Keep |
| F. Media | Announcement media 5 files | Announcements upload | Announcement media policy | Present | Keep |
| G. Products | Admin CRUD API; nav item commented out; page mostly commented | `products.js`; `Layout.tsx`; `ProductsPage.tsx` | Ops Products CMS | Improved | V1 UI was not live; V2 is |
| G. Products | `is_active` toggle | Products PUT | `draft` / `published` / `archived` | Improved | Keep |
| G. Products | IE commodities | Not in V1 | Ops IE Commodities | Present (V2-native) | Do not merge with International products |
| H. Categories | CRUD, parent, sort, image, icon, color, active | `categories.js`; `CategoriesPage.tsx` | Ops Categories create/edit, parent, status | Present (core) / Not restored (image/icon/color/sort) | Taxonomy exists; decorative V1 fields not copied |
| I. Businesses / Organizations | Company string on user | `users.company` | `Organization` + membership | Improved | V1 had no org admin. V2 orgs are read-only directory |
| I. Businesses / Organizations | Org verify/suspend | Not in V1 | `OrganizationStatus` exists; no admin mutate UI | Missing as V1 (N/A) | Do not invent org verification |
| J. Documents | Request attachments | Requests upload | Procurement documents + StoredDocument | Improved | Keep IDOR: buyer sees own |
| J. Documents | Announcement files | Announcement media | AnnouncementMedia | Present | Keep |
| K. Notifications | Admin own inbox read/unread | `NotificationsPage`; `users.js` notification routes | Ops Notifications + header menu | Present | Wired into ops nav this phase |
| K. Notifications | Admin broadcast composer | Not found | `notification:manage` templates exist as V2 | Not restored as V1 | No V1 broadcast CMS |
| L. Messaging / Chat | Admin client chat, files, unread | `ChatPage`; `backend/routes/chat.js` | Ops Support threads | Improved | Org-scoped; not a global inbox of all buyers |
| M. Payments / Transactions | None | No payment admin UI; request `payment_method` display only | Ops Invoices / Payments | Present (V2-native) | Not a V1 recovery |
| N. Dashboard / Analytics | Request counts, weekly chart, recent requests, unread chat, AI stats | `DashboardPage.tsx` | Ops Dashboard KPIs, series, attention | Improved | Keep V2 analytics |
| O. Content / CMS | Announcements as CMS | Announcement pages | Ops CMS | Present | Keep |
| O. Content / CMS | Services catalog API, no admin nav | `backend/routes/services.js` | Platform services parity API | Present (API) | No V1 admin nav item to restore |
| P. Roles / Permissions | `user` / `moderator` / `admin` column | `users.role`; `requireAdmin` | Membership roles + permission catalog | Improved | `ops_admin` = V1 admin |
| Q. Authentication | Admin login; block unverified email | `auth.js`; `email_verified` | Auth + `requireActiveUser`; suspended cannot authenticate | Improved | Keep |
| Q. Authentication | Register, verify, forgot password | `auth.js` | V2 auth lifecycle | Present | Keep; do not weaken |
| R. Settings | Large local form (SMTP, 2FA, backup, branding) | `SettingsPage.tsx` — no API calls | None | Not restored | Unwired mock. MFA/password live in auth, not this form |
| S. Order Tracking | Tracking CRUD against orders | `TrackersPage`; `backend/routes/tracker.js` | Ops Shipments | Improved | Keep |
| S. AI Assistant | Knowledge CRUD + auto-respond | `AIAssistantPage`; `backend/routes/ai.js` | Knowledge articles + Ops AI Assistant page | Restored (nav) / Present (API) | Page existed unwired in ops App; now routed |
| S. Guidance tours | Not in V1 | — | Ops Support guidance tab | Present (V2-native) | Keep |

## V1 navigation vs V2 ops navigation

| V1 nav | V1 route | V2 destination |
|---|---|---|
| Dashboard | `/` | `/` Dashboard |
| Procurement Requests | `/requests` | `/requests` |
| Users | `/users` | `/users` (now administrative, not read-only) |
| Categories | `/categories` | `/categories` |
| Product Catalog | `/products` (commented out of nav) | `/products` (live) + `/integrated-export/commodities` (isolated) |
| Announcements | `/announcements` | `/cms` |
| Client Chat | `/chat` | `/support` |
| Notifications | `/notifications` | `/notifications` (header + nav) |
| Order Tracking | `/trackers` | `/shipments` |
| AI Assistant | `/ai-assistant` | `/ai-assistant` |
| Settings | `/settings` | Not restored (unwired V1 form) |
| — | — | `/quotations` `/invoices` `/payments` `/organizations` `/audit` (V2-native) |

## User management evidence (P0)

V1 admins could list, search, filter, open detail, change `role`, change `status`, and hard-delete.

V1 `status` did **not** persist. `active` set `email_verified=true`; `inactive` and `suspended` both set `email_verified=false`. After reload the UI showed inactive for both. Login blocked unverified users, which is how “suspend” actually worked.

V2 already had `UserStatus`: `pending_verification | active | suspended | deactivated`. Authenticate requires `user.status === "active"`. This phase exposes commands:

- `suspend` — active → suspended; sessions revoked; reversible
- `activate` — suspended or deactivated → active; not allowed from pending_verification
- `deactivate` — reversible replacement for V1 hard delete; data retained
- `grant` / `revoke` operations access — `ops_admin` membership role

V1 was globally admin. V2 ops identity directory is already platform-wide for `ops:access` holders. Mutations match that existing product authority, with last-admin and self-change guards that V1 lacked.
