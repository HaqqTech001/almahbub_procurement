# Authority, procurement, announcement media, and navigation audit

**Date:** 2026-08-18  
**Method:** Traced V1 UI → API → controller/service → MySQL, then compared to V2 command/state architecture. Capabilities not present in V1 source are labelled **NOT ESTABLISHED IN LEGACY**.

Related trees:

- V1 buyer: `client-frontend/` (READ ONLY)
- V1 admin: `admin-dashboard/` (READ ONLY)
- V1 API: `backend/` (READ ONLY)
- V2: `apps/web`, `apps/ops`, `apps/api`, `packages/ui`, `database/prisma`

---

## 1. Admin procurement authority

### 1.1 Approve a request

| Field | Finding |
| --- | --- |
| **V1 behavior** | Admin detail `PUT /api/v1/requests/:id { status: "approved" }`. No quotation module. “Approve” was a free-form order status, not a buyer quote decision. |
| **V1 authority** | `requireAdmin` (`role === 'admin'`). Any listed status from any current status. |
| **V2 equivalent** | Early work acceptance: command `accept_for_sourcing` (`submitted` → `accepted_for_sourcing`), permission `request:manage`. After an issued quote: command `approve` (`quote_issued` → `approved`), also `request:manage`. Buyer commercial yes/no is **quotation** `accept`/`decline`, which already moves the request to `purchase_in_progress`. |
| **V2 implemented?** | API yes. Ops UI wired `accept_for_sourcing` but **did not expose** `approve` or `start_purchase`. |
| **Missing** | Ops request detail must show state-valid `approve` (quote issued) and `start_purchase` (approved). Buyer must never receive those request commands. |
| **Required permission** | `request:manage` (API already). |
| **Recommended V2** | Wire existing commands. Do not restore V1 unconstrained status dropdown. Label `accept_for_sourcing` as **Approve for sourcing**. |
| **Remain unchanged** | V2 state machine; quotation accept path. |

### 1.2 Change / process / complete / cancel status

| Field | Finding |
| --- | --- |
| **V1 behavior** | Admin list/detail saved any of `pending, received, reviewing, discussion, sourcing, processing, approved, rejected, completed, cancelled`. No transition graph. Buyer cancel API only from `pending`/`received` (`PUT /:id/cancel`); buyer UI was broken. |
| **V2 equivalent** | `request_clarification`, `accept_for_sourcing`, `start_sourcing`, `start_purchase`, `fulfill`, `close`, `cancel`. |
| **V2 implemented?** | Machine + API yes. Ops UI omitted `start_purchase`, `approve`, `decline`. `fulfill`/`close`/`cancel`/`start_sourcing` already in `adminRequestCommands`. |
| **Missing** | Expose remaining ops commands that the machine already allows. |
| **Required permission** | `request:manage`; cancel also `request:cancel` or requester. |
| **Recommended V2** | State-aware buttons only. Invalid transitions stay 409. |
| **Remain unchanged** | Do **not** reintroduce V1 free-form status. |

### 1.3 Reject a request

| Field | Finding |
| --- | --- |
| **V1 behavior** | Admin could set `rejected` at any time. |
| **V2 equivalent** | Early: `cancel` with reason. Quote stage: request `decline` (`quote_issued` → `declined`) or buyer quotation `decline`. No `rejected` status code. |
| **V2 implemented?** | `cancel` on Ops UI. Request `decline` **not** in `adminRequestCommands`. |
| **Missing** | Wire `decline` for `quote_issued` when `request:manage`. |
| **Required permission** | `request:manage` + reason. |
| **Recommended V2** | Label **Reject**. Do not invent a new status. |
| **Remain unchanged** | Buyer quotation decline. |

### 1.4 Assign / handle

| Field | Finding |
| --- | --- |
| **V1 behavior** | Detail showed “Assigned To”. **No assign picker or API.** |
| **V2 equivalent** | `assignProcurementRequest` + `request:assign`. |
| **V2 implemented?** | Yes on Ops detail. |
| **Missing** | None vs V1 (V2 already exceeds V1). |
| **Remain unchanged** | Buyer must not see assignment controls (already hidden). |

### 1.5 View customer, items, documents

| Field | Finding |
| --- | --- |
| **V1 behavior** | Admin saw client card, items, files. Buyer saw items and **admin_notes leak**; files were **not** shown on buyer detail. |
| **V2 equivalent** | Ops customer panel + items + attachments. Buyer items + attachments; no assignee/actor names. |
| **V2 implemented?** | Yes. |
| **Missing** | None required. Do **not** restore admin notes on buyer. |
| **Remain unchanged** | Audience serialize (`procurement-request-serialize.ts`). |

---

## 2. Buyer vs Ops responsibilities

| Actor | Question | Commands they may receive |
| --- | --- | --- |
| Buyer | What is happening with **my** request? | `submit`, `cancel`, `request_revision`; quotation `accept`/`decline` |
| Ops | What action do I take on this request? | `request_clarification`, `accept_for_sourcing`, `start_sourcing`, `approve`, `decline`, `start_purchase`, `fulfill`, `close`, `cancel`; quotation `review`/`issue`; assign |

API remains authoritative: `assertTransitionPermission` requires `request:manage` for ops verbs. Hidden buttons are not the security boundary.

---

## 3. Announcement media (V1 evidence)

Traced `admin-dashboard` announcement form → `POST/PUT /api/v1/announcements` → `backend/routes/announcements.js` multer `upload.array('media', 5)`:

- **Supported:** image (jpeg/png/gif), video (mp4/avi/mov), documents (pdf/doc/docx/txt)
- **Limit:** 5 files, 10MB each
- **Storage:** `/uploads/announcements/` static; JSON `media_files` on the row
- **Replace/remove:** PUT accepted new files + `removeMedia`
- **Public display:** buyer `AnnouncementDetailPage` rendered `media_files`
- **Admin management:** create/edit/delete/pin/status (pin/schedule **not** restored here)
- **NOT ESTABLISHED as a separate thumbnail pipeline**
- **Buyer create/edit/publish:** routes commented out in V1 `App.tsx`

V2 CMS (`apps/ops` `/cms`) had title/slug/summary/body/status only. **Media was missing.**

**Recommended V2:** attach via existing `DocumentService` + `AnnouncementMedia` join. Public stream only when the announcement is **published**. Permissions remain `ops:access` \| `cms:manage` \| `communication:publish`. Do not restore replies, reactions, pin, schedule, or expire.

`#Hamd'26` stays in `apps/web/src/content/campaigns.ts`. CMS must not edit it.

---

## 4. Navigation boundary

| Link | Current | Problem |
| --- | --- | --- |
| IE drawer/footer “Almahbub International” | `to="/"` | Leaves the IE portal for the public homepage. Authenticated public header remaps `/` to `/app`, so the same label does not mean the same place. |
| IE footer “International profile” | `/businesses/almahbub-international` | Correct informational landing. |
| Public landing | `/businesses/almahbub-international` | Must remain public. Must not become the workspace. |
| Authenticated work | `/app/requests` (and related `/app/*`) | Must remain the procurement workspace. |
| Authenticated public header Home | remaps `/` → `/app` | Correct work-context brand home. |

**Recommended:** IE “Almahbub International” informational links go to `/businesses/almahbub-international`, not `/`. Do not logout, replace the workspace shell, or loop. Signed-out users still reach the public profile. Workspace “Requests” stays the work area.

---

## 5. Copy

User-facing em dashes appear in empty-value placeholders (`RequestDetailView`, `RequestHub`), homepage image alt, representative caption, Ops CMS/commodity helper text, and many `group.ts` portal sentences. Source attribution (`Unsplash —`) and `#Hamd'26` slide copy stay.

---

## 6. Explicitly not invented

- V1 quotation workflow (none)
- V1 assign API (none)
- Announcement replies/reactions/pin/schedule
- Buyer announcement CMS
- Second procurement engine or free-form status
- Changing `#Hamd'26` copy
- IE commodity / International category media (out of scope; do not regress)
