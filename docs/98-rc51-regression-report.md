# RC5.1 - Regression Report

**Status date:** 2026-08-06  
**Purpose:** Capture behavioural differences and risk when switching buyers from `client-frontend` to `@hamd/client` (`apps/web`).

---

## 1. Executive regression verdict

| Area | Risk | Summary |
| --- | --- | --- |
| Auth | Low | V2 is stronger; watch cookie domain / CORS in prod |
| Marketing pages | Low | Content/model differs; URLs largely preserved |
| Procurement | Low–Med | RC5.2 API-backed; attachments/comments still deferred |
| Notifications | Low–Med | Different event model vs V1 MySQL feed |
| Chat | **Critical** | Capability absent on V2 |
| Announcements | **High** | Buyer feed absent on V2 |
| Quotations / shipments | N/A (new) | Additive; no V1 regression |

**Production cutover without resolving Critical/High rows will regress live buyers.**

---

## 2. Workflow-by-workflow regression notes

### Auth

| Check | Expected | Risk if failed |
| --- | --- | --- |
| Login sets session | Refresh cookie + access memory | Session loop |
| Register → verify | Email/OTP path works | Signup abandonment |
| Forgot / reset | Token pages work | Account recovery outage |
| Logout / logout-all | Sessions revoked | Stale access |
| Lockout UX | `/account-locked` | Confused retries |

V2 **improves** V1; regression risk is environment config, not missing screens.

### Marketing & legal

| Check | Notes |
| --- | --- |
| Home / about / FAQ / contact / privacy / terms | Present |
| Services vs categories | IA changed - train support on new URLs |
| Help centre | V1 `/help` → use FAQ/contact until alias added |
| Contact submit | Verify live endpoint; V1 had stub risk |

### Procurement requests

| V1 | V2 | Regression |
| --- | --- | --- |
| Persists via V1 backend orders/requests | `apps/api` procurement-requests | **RC5.2 - cross-device** |
| Multi-step create | Wizard + API create/submit | OK |
| List / detail / status | Workspace + API transitions | OK |
| Cancel | API `cancel` transition | OK when permitted |
| Attachments | Incomplete FormData in V1 | Still no document platform |

**Regression test gate:** create request on device A → must appear for same user on device B via API. **Expected pass after RC5.2.**

### Notifications

| Check | Notes |
| --- | --- |
| Inbox list | Hosted `/app/notifications` |
| Mark read | Must hit V2 notification API |
| Realtime | WS + polling fallback |
| V1 event types | May not map 1:1 - sample production events |

### Chat / support

| Check | Result |
| --- | --- |
| Open `/chat` equivalent | **FAIL - no route** |
| Message history | **FAIL - no API** |
| Chatbot settings | **FAIL** |

Any buyer who relied on in-app support chat **will regress** on cutover.

### Announcements

| Check | Result |
| --- | --- |
| List / detail CMS announcements | **FAIL** |
| Homepage campaign banner | Present (static/config) - not a substitute |

### Profile / settings

| Check | Notes |
| --- | --- |
| View profile | Settings |
| Edit name / phone / etc. | Limited vs V1 profile form - **possible soft regression** |
| Password change | Confirm settings coverage before cutover |
| Sessions / devices | New - positive change |

---

## 3. Known V1 defects that must not be “ported”

Do not reintroduce:

- Cancel request via missing `updateOrder`
- Contact `post` stubs that silently no-op
- Mocked email resend success
- File fields not appended to FormData
- Dead MyOrders / OrderDetail surfaces as “missing parity”

---

## 4. Suggested automated / manual regression pack

### Smoke (every deploy)

1. Login → `/app` → logout  
2. Register → verify path (staging)  
3. Create draft request → reload → draft still present (**local until API**)  
4. Open quotations list (auth)  
5. Open notifications list  
6. Open shipments list  
7. Public home + products + contact  

### Cutover-critical (must pass before DNS switch)

1. Procurement create/list/detail against **API** (not localStorage)  
2. Chat path or documented deferral with alternate support channel live  
3. Announcements path or documented deferral  
4. Session cookie on production domain  
5. Notification mark-read + unread badge  
6. Password reset end-to-end email  

### Non-goals for RC5.1 regression

- Pixel-perfect V1 UI match  
- Porting orphan pages  
- Admin dashboard parity (separate host)

---

## 5. Residual risk register

| ID | Risk | Severity | Mitigation |
| --- | --- | --- | --- |
| R1 | Chat cutover | Critical | Keep V1 chat URL behind reverse proxy **or** defer with phone/email SLA |
| R2 | PR attachments/comments | Medium | Document platform; empty arrays + deferral messages |
| R3 | Announcements | High | CMS module or deferral memo |
| R4 | Profile edit | Medium | Settings PATCH UI |
| R5 | Category IA change | Medium | Redirects + support playbook |
| R6 | Notification event mismatch | Medium | Event mapping review |

---

## Related

- [Parity matrix](./97-rc51-feature-parity-matrix.md)
- [Cutover checklist](./99-rc51-cutover-checklist.md)
