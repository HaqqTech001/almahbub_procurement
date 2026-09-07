# Pre-Implementation Review & Design Decision Log

**Scope:** Legacy `client-frontend/` + `admin-dashboard/` vs Phase 3 public/client/ops blueprints  
**Rule:** Complete this review before implementing any screen  
**Deliverable:** Keep / Refactor / Replace · workflow preservation · Design Decision Log  

---

## Verdict

**Do not implement screens by restyling the legacy SPAs.**  
Treat them as **workflow and field reference**. Build three new shells (Public Website, Client Workspace, Operations Console) on the HAMD design system and new API, with parity checklists for dependent business workflows.

---

## 1. Existing implementation (summary)

| Surface | Path | Role today |
| --- | --- | --- |
| Client app | `client-frontend/` | Marketing + buyer workspace in one Vite/React app |
| Admin app | `admin-dashboard/` | Ops console: requests, users, catalog, chat, CMS, charts |
| Public site | - | Not a separate app; legacy home lives inside client-frontend |
| New frontends | - | Not built yet (Phase 3 docs/canvases only) |

---

## 2. Keep

| Item | Why |
| --- | --- |
| Request create field model | Items, budget, delivery, attachments → wizard intake |
| Request lifecycle concept | Progress from received → complete (rename to procurement vocabulary) |
| Auth journeys | Register, verify, login, forgot/reset, profile |
| Category → request handoff | Discovery context into a request |
| Need for human support | Users expect help; rebuild as record-linked messaging |
| Announcements / CMS need | Ops Experience publishing |
| Admin triage need | List → detail → act |
| Brand mark / assets | After quality check |
| Notification unread habit | Evolve to inbox + deep links |

---

## 3. Refactor

| Item | Direction |
| --- | --- |
| Marketing + buyer mashup | Split into Public / Client shells |
| Orders / cart language | Request → Quote → Pay → Ship |
| Progress bar UI | Keep mental model; bind to new state machine |
| Services/category browse | Evidence-led catalog + product cards |
| Live chat as hub | Support path remains; not system of record for approvals/pay |
| Admin chart-first home | Attention queues first |
| Flat admin sidebar | Family nav + Record Workbench |
| localStorage JWT pattern | httpOnly refresh + CSRF via new auth API |
| Duplicated shadcn UI forks | Tokenized HAMD component library |

---

## 4. Replace

| Item | Replace with |
| --- | --- |
| Legacy apps as product UI | New shells; legacy = reference only |
| MyOrders / ShoppingCart metaphors | Procurement vocabulary & icons |
| Unrestricted status `<select>` | Policy-gated transitions only |
| Collage / weak hero patterns | Accountable Corridor hero |
| Vanity KPI-first ops home | Queue-first command center |
| Joyride-default onboarding | Inline empty states; optional tours later |
| Parallel `api.ts` / socket stacks | Typed API client; scoped realtime later |
| Orphan pages (`ChatPage1`, unused Orders, etc.) | Delete from product surface |

---

## 5. Preserve successful business workflows

| Workflow | Preservation rule |
| --- | --- |
| Auth lifecycle | Same steps; upgrade security without renaming the journey |
| Browse → create request | Same outcome; Catalog → Product → Request wizard |
| Track my request | Progress expectation stays; richer quote/pay/ship when ready |
| Message support | Still reachable; prefer deep link to request record |
| Admin process request | Still triage; **no arbitrary status jumps** |
| Publish announcement | Still publish from Ops CMS |
| Notifications | Unread habit remains; deep-link to decisions |

**Visual quality may change** (navy system, hierarchy, motion).  
**Task sequences and outcomes must stay recognizable** so returning users are not retrained from zero.

### Visual upgrade without expectation shock

| May change | Must not surprise |
| --- | --- |
| Color, type, spacing, hero craft, card density | How to start a request from browse |
| Nav chrome (mega/drawer) with **same destination names** | Where “my requests” live |
| Admin home = queues first | That support can still be reached |
| | That admins can still find and advance requests |

---

## 6. Design Decision Log

| ID | Decision | Problem | Choice | Expectation preserved |
| --- | --- | --- | --- | --- |
| **D1** | Three separate experiences | Legacy mashup confuses roles | Public / Client / Ops shells | Users still request, track, message - clearer homes |
| **D2** | One public primary CTA | Multi-CTA noise | Persistent **Request Procurement** | Same conversion goal |
| **D3** | Accountable Corridor hero | Ecommerce/search-first heroes fail trust | Brand-first full-bleed + quick entry | Start a request in ≤5 seconds |
| **D4** | Procurement vocabulary | Orders/cart train the wrong model | Request→Quote→Pay→Ship | Same job: obtain goods |
| **D5** | Structured wizard (phased) | Single form underspecifies briefs | Wizard with field parity + autosave | Familiar fields, better structure |
| **D6** | Product cards without cart | Retail stock metaphors | MOQ/lead/source confidence + Request | Browsing still feels like discovery |
| **D7** | Chat not system of record | Unauditable approvals | Async record messages first; live chat later | Support still reachable |
| **D8** | Ops queues + permitted transitions | Unsafe free status edits | Record Workbench actions only | Admins still clear work - safely |
| **D9** | Trust = evidence only | Vanity metrics kill premium | Sourced stats/certs/cases | Proof without hype |
| **D10** | Tokens over porting shadcn forks | Duplication + teal drift | HAMD design system | Controls stay recognizable |
| **D11** | Freeze nav/footer IA | Label drift across docs/apps | Masterplan + nav/footer blueprints | Destinations remain findable |
| **D12** | No big-bang legacy rewrite | Risk + expectation shock | Phased shells + vertical slices + parity checklists | Workflows migrate deliberately |

---

## 7. Pre-screen implementation gate

Before any UI screen:

1. Confirm workflow parity checklist for that screen’s journey  
2. Confirm Keep/Refactor/Replace row above  
3. Confirm Design Decision ID(s) that apply  
4. Confirm API/contract readiness (no UI for unsupported promises)  
5. Pass attention laws (docs/51): one primary action, squint test  

---

## Related

- Legacy: `client-frontend/`, `admin-dashboard/`  
- Blueprints: `docs/46`–`56`, canvases under Phase 3  
- Canvas: `pre-implementation-review-design-decision-log.canvas.tsx`

---

## STOP

Review and Design Decision Log complete. No screen implementation in this step.
