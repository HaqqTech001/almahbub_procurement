# Authority, procurement, announcement, navigation, and copy report

**Date:** 2026-08-18  
**Phase:** Investigation and implementation. Stop here. Do not start another feature phase.

Audit source: `docs/authority-v1-v2-audit.md`. V1 trees remain READ ONLY.

---

### Legacy V1 findings

Admin procurement (`admin-dashboard` → `PUT /api/v1/requests/:id`) was a free-form status write. Any admin could set `pending | received | reviewing | discussion | sourcing | processing | approved | rejected | completed | cancelled` from any current status. There was no quotation module. “Approve” meant setting status to `approved`. Assignment was display-only. Buyer cancel existed on the API from `pending|received` only.

Announcement media (`backend/routes/announcements.js`) accepted up to five files, 10MB each: jpeg/png/gif, mp4/avi/mov, pdf/doc/docx/txt. Files were stored under `/uploads/announcements/` and referenced as JSON `media_files`. Public and admin UIs rendered them. Buyer CMS create/edit was not live.

---

### V2 gaps

Ops request detail used `adminRequestCommands` but omitted `approve`, `decline`, and `start_purchase` even though the state machine and `request:manage` API already defined them. Buyer hosts already used `customerRequestCommands`.

The `Announcement` model had no media. Ops CMS was title/slug/summary/body/status only. Public slides and detail pages could not show attached files.

IE drawer and footer labelled “Almahbub International” pointed at `/`. Authenticated public header remaps `/` to `/app`, so that brand click left the IE portal for the workspace home.

User-facing em dashes appeared in request empty values, homepage alt, representative captions, Ops commodity helper text, and some International image alts.

---

### Procurement fixes

No second engine. Existing commands were wired.

| V1 admin action | V2 command | Ops label | Permission |
| --- | --- | --- | --- |
| Early accept / process | `accept_for_sourcing` | Approve for sourcing | `request:manage` |
| Quote-stage approve | `approve` | Approve quote | `request:manage` |
| Reject | `decline` (quote) or `cancel` (earlier) | Reject / Cancel | `request:manage` or `request:cancel` |
| Move to purchase | `start_purchase` | Start purchase | `request:manage` |
| Complete / close | `fulfill`, `close` | already present | `request:manage` |

HTTP floor: `requireProcurementTransitionPermission` now mirrors quotation auth. Buyer submit/cancel still reach the service. Admin verbs 403 without `request:manage`. Invalid transitions remain 409 from the state machine.

Ops UI shows only `adminRequestCommands` for the current status. Completed/closed requests do not show Approve.

---

### Buyer restrictions

Buyers still receive only `submit`, `cancel`, and `request_revision` on the request, plus quotation `accept`/`decline` when a quote is issued. They do not receive approve, reject, start purchase, assignment, or customer panels. `customerRequestCommands` filters even if `request:manage` is present on the token. API 403 remains the security boundary.

International procurement LOB helpers and isolation are unchanged.

---

### Announcement media

Restored V1 evidence only: image, video (mp4/mov/avi), and document attachments; max 5; 10MB; attach and remove.

Implementation reuses `StoredDocument` plus `AnnouncementMedia` join (`database/prisma/migrations/20260818120000_announcement_media`). Public stream is `GET /api/v1/announcements/:id/media/:mediaId` for published rows. Drafts 404 unless the caller has CMS/ops parity manage. Attach/delete require `ops:access | cms:manage | communication:publish`. Public users cannot upload.

Ops CMS can attach files after create/save and remove existing items. Public slider uses the first image. Detail pages render image, video, or file links. `#Hamd'26` stays in `apps/web/src/content/campaigns.ts` and is not CMS-editable.

Not restored (not this phase / not live V1 buyer CMS): replies, reactions, pin, schedule, expire, separate thumbnail pipeline.

---

### Navigation

IE “Almahbub International” drawer and footer links now go to `/businesses/almahbub-international` (the public informational landing). “International profile” is unchanged. The public landing is not the workspace.

Authenticated workspace keeps **Almahbub Integrated Export** as the IE portal. The workspace brand remains **Almahbub International** at `/app` so a brand click stays in work context. Requests remain `/app/requests`. Signed-out International navigation is unchanged. Authenticated header still inserts IE after Products and remaps Home to Dashboard only for `href === "/"`.

---

### Copy cleanup

Replaced unnecessary em dashes in product chrome, not in Unsplash attributions or `#Hamd'26` slides:

- Request empty values: “Not provided” / “Unknown date”
- Homepage overview image alt
- Representative media caption
- Two International category image alts
- Ops commodity draft/helper labels

IE owner-approved `group.ts` essays were left in place (approved business copy). Code comments were not globally rewritten.

---

### Security

| Case | Result |
| --- | --- |
| Unauthenticated admin command | 401 |
| Buyer `approve` / `accept_for_sourcing` / `start_purchase` / etc. | 403 |
| Buyer announcement create/media | 403 |
| Unauthenticated announcement mutate | 401 |
| Ops `request:manage` + valid command | reaches service |
| Invalid state transition | 409 `INVALID_STATE_TRANSITION` |
| Draft announcement media without CMS auth | 404 (no leak) |
| LOB list `lob=all` without `request:manage` | still denied |
| Org-scoped announcement mutate | existing org-or-null filter |

UI hiding is not the security boundary.

---

### Tests

**Unit / integration**

- `packages/ui` lifecycle, RequestHub/detail audience, command labels
- `apps/api` transition HTTP floor, state machine approve/reject, announcement admin+media routes, multipart `media` field, route policy
- `apps/web` announcement slide media, `#Hamd'26` unchanged (no em dash in wedding slides), workspace nav, IE International hrefs

**Playwright / axe** (targeted, chromium-desktop)

- `apps/web/e2e/authority-nav-announcement.spec.ts`: signed-out International landing; IE International brand/footer to public profile without login loop; `#Hamd'26` slider; viewports 320–1440; axe on International + IE
- `apps/web/e2e/nav-international-responsive.spec.ts`: Group CTA, category media, authenticated IE header/workspace, IE navbar viewports including 1440, axe
- `apps/web/e2e/phase-2c-request-lifecycle.spec.ts`: buyer must not see ops approve commands
- `apps/ops/e2e/authority-cms-requests.spec.ts`: ops request actions + CMS media. Skipped in this environment because `HAMD_OPS_E2E_EMAIL` / `HAMD_OPS_E2E_PASSWORD` were not set.

Result this phase: web targeted specs passed after fixing desktop hamburger (drawer asserted at 390) and Hamd slide rotation. Workspace brand remains “Almahbub International” → `/app`; a second identically named public-profile nav item was not added, because it collided with the work brand.

**Known pre-existing flake:** `RequestCreateWizard` `scrollIntoView` in jsdom (`packages/ui` procurement wizard). Not caused by this phase.

---

### Build

| Gate | Result |
| --- | --- |
| `@hamd/database` generate + build | pass |
| `@hamd/ui` typecheck, lint, build | pass |
| `@hamd/api` typecheck, lint, build | pass |
| `@hamd/web` typecheck, lint | pass |
| `@hamd/ops` typecheck, lint | pass |
| `@hamd/web` / `@hamd/ops` production build | pass |

Apply migration `20260818120000_announcement_media` on each environment before using CMS media in that database.

---

### Remaining gaps

Evidence-based only:

1. V1 announcement replies, reactions, pin, and schedule remain unrestored.
2. Announcement binaries still use the existing local `StoredDocument` disk, not a second CDN. Production object-storage for public announcement files can reuse catalog S3 later if required.
3. V1 unconstrained status dropdown stays retired.
4. IE `group.ts` essay punctuation was not rewritten.
5. International category media quality correction from the prior interrupted pass is out of scope here and is not claimed complete.

STOP AFTER THIS PHASE.
