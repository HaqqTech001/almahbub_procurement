# Version 1 API Inventory

Base URL (local): `http://localhost:5000`  
Version prefix: `/api/v1`  
Version 2 API (local): `http://127.0.0.1:4000` with the same `/api/v1` prefix where mounted.

**Legend**

| Tag | Meaning |
| --- | --- |
| **Mapped** | Clear Version 2 counterpart exists |
| **Partial** | Related Version 2 capability exists; path/shape differs or incomplete |
| **Missing** | No Version 2 HTTP equivalent yet |
| **V2-only** | Exists in Version 2; not a Version 1 endpoint |

---

## Health & diagnostics

| V1 method & path | V2 counterpart | Status |
| --- | --- | --- |
| `GET /api/health` | `GET /health/live`, `GET /health/ready` | Partial |
| `GET /api/test-email` (debug gate) | - | Missing (intentionally not carried) |
| `GET /api/test-email-send` (debug gate) | - | Missing |
| - | `GET /openapi.json`, `GET /docs` | V2-only |

---

## Authentication (`/api/v1/auth`)

| V1 | V2 | Status |
| --- | --- | --- |
| `POST /api/v1/auth/register` | - | Missing |
| `POST /api/v1/auth/login` | `POST /api/v1/auth/login` | Mapped |
| `POST /api/v1/auth/verify-email/:token` | - (schema: EmailVerificationToken) | Missing |
| `POST /api/v1/auth/forgotpassword` | - (schema: PasswordResetToken) | Missing |
| `POST /api/v1/auth/resetpassword/:token` | - | Missing |
| `GET /api/v1/auth/me` | `GET /api/v1/auth/me` | Mapped |
| `PUT /api/v1/auth/updatedetails` | `PATCH /api/v1/auth/profile` | Partial |
| `PUT /api/v1/auth/updatepassword` | - | Missing |
| `POST /api/v1/auth/admin/login` | Use unified login + RBAC | Missing (by design to replace) |
| `GET /api/v1/auth/notifications` | `GET /api/v1/notifications` | Partial |
| `PUT /api/v1/auth/notifications/:id/read` | `POST /api/v1/notifications/read` | Partial |
| `PUT /api/v1/auth/notifications/read-all` | `POST /api/v1/notifications/read` | Partial |
| - | `POST /api/v1/auth/refresh` | V2-only |
| - | `POST /api/v1/auth/logout` | V2-only |
| - | `GET /api/v1/auth/validate` | V2-only |

---

## Procurement requests / orders

Version 1 exposes parallel `/requests` and `/orders` routers over the MySQL `orders` table.

| V1 | V2 | Status |
| --- | --- | --- |
| `POST /api/v1/requests/` | `POST /api/v1/procurement-requests` | Mapped |
| `GET /api/v1/requests/` | `GET /api/v1/procurement-requests` | Mapped |
| `GET /api/v1/requests/user/:userId` | List with auth scope | Partial |
| `GET /api/v1/requests/:id` | `GET /api/v1/procurement-requests/:requestId` | Mapped |
| `PUT /api/v1/requests/:id` | `PATCH /api/v1/procurement-requests/:requestId` | Partial |
| `DELETE /api/v1/requests/:id` | archive/restore model | Partial |
| `PUT /api/v1/requests/:id/cancel` | `POST .../transitions` | Partial |
| `GET /api/v1/requests/admin/stats/overview` | - | Missing |
| `POST|GET|PUT|DELETE /api/v1/orders/...` (same shapes) | `/api/v1/procurement-requests` | Partial (dedupe into one domain) |
| - | `POST .../transitions` | V2-only |
| - | `POST .../assignments` | V2-only |
| - | `POST .../archive` \| `restore` \| `duplicate` | V2-only |

---

## Tracker / shipments

| V1 | V2 | Status |
| --- | --- | --- |
| `POST /api/v1/tracker/` | `POST /api/v1/shipments` | Partial |
| `GET /api/v1/tracker/` | `GET /api/v1/shipments` | Partial |
| `GET /api/v1/tracker/order/:orderId` | list/filter by request linkage | Partial |
| `PUT /api/v1/tracker/:id` | `PATCH /api/v1/shipments/:shipmentId` | Partial |
| `DELETE /api/v1/tracker/:id` | - | Missing |
| - | milestones, containers, tracking, documents, evidence, inspections, confirm-delivery, history, timeline | V2-only |

---

## Catalog

| V1 | V2 | Status |
| --- | --- | --- |
| `GET|POST|PUT|DELETE /api/v1/categories...` | - (Prisma `ProductCategory`) | Missing |
| `GET|POST|PUT|DELETE /api/v1/products...` | - (Prisma `Product` et al.) | Missing |
| `GET|POST|PUT|DELETE /api/v1/services...` | - | Missing |

---

## Announcements / CMS

| V1 | V2 | Status |
| --- | --- | --- |
| `GET /api/v1/announcements/` | - | Missing |
| `GET /api/v1/announcements/:id` | - | Missing |
| `POST /api/v1/announcements/:id/view` | - | Missing |
| `POST /api/v1/announcements/:id/react` | - | Missing |
| `GET /api/v1/announcements/:id/reactions` | - | Missing |
| `POST|GET /api/v1/announcements/:id/replies` | - | Missing |
| `POST|PUT|DELETE /api/v1/announcements/...` (admin) | - | Missing |

---

## Chat / messages

| V1 | V2 | Status |
| --- | --- | --- |
| `POST /api/v1/chat/send` | - | Missing |
| `GET /api/v1/chat/conversation/:userId` | - | Missing |
| `GET /api/v1/chat/conversations` | - | Missing |
| `PUT /api/v1/chat/markread/:userId` | - | Missing |
| `DELETE /api/v1/chat/:id` | - | Missing |
| `GET /api/v1/chat/unread/count` | - | Missing |
| `GET /api/v1/chat/support` | - | Missing |
| `GET /api/v1/chat/support/messages` | - | Missing |
| `POST /api/v1/chat/support/send` | - | Missing |
| Socket.IO events (`send_message`, `new_message`, …) | - | Missing |

---

## Users

| V1 | V2 | Status |
| --- | --- | --- |
| `GET /api/v1/users/` | - | Missing |
| `GET /api/v1/users/:id` | `GET /api/v1/auth/me` (self only) | Partial |
| `PUT /api/v1/users/:id` | `PATCH /api/v1/auth/profile` (self) | Partial |
| `DELETE /api/v1/users/:id` | - | Missing |
| `GET /api/v1/users/:id/dashboard` | - | Missing |
| `GET /api/v1/users/:id/notifications` | `/api/v1/notifications` | Partial |
| Notification mark-read under users | `/api/v1/notifications/*` | Partial |

---

## AI

| V1 | V2 | Status |
| --- | --- | --- |
| `POST /api/v1/ai/auto-respond` | - | Missing |
| `POST|GET /api/v1/ai/knowledge` | - | Missing |
| `PUT /api/v1/ai/knowledge/:id` | - | Missing |
| `GET /api/v1/ai/stats` | - | Missing |
| `POST /api/v1/ai/learn` | - | Missing |

---

## Version 2 domains with no Version 1 equivalent

| V2 | Notes |
| --- | --- |
| `/api/v1/quotations` | New commercial domain |
| `/api/v1/invoices` | New finance domain |
| `/api/v1/payments` | New finance domain |
| `/api/v1/notification-preferences` | New |
| `/api/v1/admin/communication/templates` | New |

---

## Missing API summary (blockers for V1 retirement)

1. Catalog: categories, products, services  
2. CMS: announcements (+ engagement)  
3. Chat / realtime messaging  
4. Users administration  
5. AI knowledge / auto-respond  
6. Auth parity: register, verify-email, forgot/reset password, update password, admin login strategy  
7. Admin analytics overview endpoints  

Until these are addressed (or explicitly retired as product decisions), Version 1 APIs remain the reference for those workflows.
