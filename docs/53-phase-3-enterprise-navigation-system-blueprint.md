# Phase 3 - Enterprise Navigation System Blueprint

**Brand:** Almahbub International  
**Platform:** Powered by HAQQ TECH  
**Mission:** Navigation that makes procurement simple  
**Deliverable:** UX · Accessibility · Motion · Implementation strategy. No React.

---

## 1. Doctrine

1. **Orient → find → request** - Nav never competes with the page’s one primary action.  
2. **Same IA everywhere** - Desktop mega menu, mobile drawer, and footer use the same labels.  
3. **Request is persistent** - One clear **Request Procurement** control; no equal-weight rivals.  
4. **Search is a verb** - Command search finds; nav browses. Mega menu is not a results UI.  
5. **Keyboard first-class** - Menus, drawers, and breadcrumbs work without a pointer.  
6. **Click to open mega menus** - Never hover-only (fails touch and accessibility).

---

## 2. UX Blueprint - Desktop

### Sticky Header

| Spec | Detail |
| --- | --- |
| Contents | Brand · Primary links · Command Search · Request Procurement · Account |
| Behavior | Becomes sticky after slight scroll; may compress height; **never hides Request** |
| Visual | Border/elevation when stuck; no content jump (reserve height) |

### Mega Menu

| Spec | Detail |
| --- | --- |
| Triggers | Services, Catalog, Industries (capability panels) |
| Open | Click / Enter / Space - **not hover-only** |
| Close | Esc, click outside, choose link, scroll |
| Contents | Categories + short descriptors + View all + quiet contextual Request |
| Depth | Max **2 levels** in header; deep taxonomy lives on catalog pages |

### Breadcrumbs

| Spec | Detail |
| --- | --- |
| When | Depth ≥ 2 |
| Format | Home › Section › Page [› Product] |
| Rules | Current page not linked; driven by route config; truncate middle if needed |
| Role | Journey recovery + SEO path - reflects IA |

### Command Search

| Spec | Detail |
| --- | --- |
| Pattern | Shared `SearchCombobox` (Enterprise Search UX) |
| Focus | `/` or search control |
| Commit | Enter → results; Esc → return focus to trigger |
| Suggest | Products · Categories · Suppliers (scoped) · Recent/Saved/Popular |

### Category Navigation

| Spec | Detail |
| --- | --- |
| In header | Mega panel summaries |
| On catalog | Facet rail / category tree (authoritative) |
| Rule | Header browses; catalog filters narrow |

### Footer Navigation

| Spec | Detail |
| --- | --- |
| Groups | Services · Discover · Proof · Support · Company · Legal · Track |
| Credit | **Powered by HAQQ TECH** |
| Rule | Static mirror of IA; legal links only in footer (and legal pages) |

---

## 3. UX Blueprint - Mobile

### Responsive Drawer

- Full IA + utility (Track, FAQ, Contact, Account)  
- Focus trap; Esc/backdrop close; return focus to menu button  
- Body scroll lock while open  
- Same labels as desktop  

### Collapsible Categories

- Accordion inside drawer  
- Prefer one open branch at a time  
- Announce expanded/collapsed to AT  
- All destinations still reachable  

### Quick Procurement Button

- Header-persistent and/or safely inset control  
- ≥44px; never covers critical content  
- **One primary only** - do not add a second FAB if header already has Request  

### Bottom Navigation

| Surface | Rule |
| --- | --- |
| **Public website** | Prefer header + drawer; **no bottom nav by default** (marketing journey) |
| **Client workspace** | Optional: Home · Catalog · Requests · Deliveries · More (≤5) |
| Request | Do not duplicate: either header CTA **or** center tab - not both at full weight |

---

## 4. Interaction rules

| Interaction | Behavior | UX improvement | Performance |
| --- | --- | --- | --- |
| Scroll | Sticky/compact header; close mega on scroll; keep Request | Orientation + conversion | transform/opacity; no scroll-jack |
| Hover | 120ms tone/underline on links; mega does **not** open | Predictable; touch-safe | CSS only |
| Focus | Visible 2px ring; open mega via click/keyboard | Keyboard parity | None |
| Keyboard | Skip → Brand → Primary → Search → Request → Account → main | Full tasks without pointer | None |
| Search | Shared combobox in header and drawer | One mental model | Debounce + abort |
| Mega | Click open; Esc/outside close; arrows within panel | Browse without dead ends | 180–240ms panel |
| Drawer | Toggle; scroll lock | Mobile IA | 240–320ms |
| Breadcrumb | Prior crumbs navigate up | Recovery | Static |

### Focus order (desktop header)

1. Skip to content  
2. Brand (home)  
3. Primary nav / mega triggers  
4. Search  
5. Request Procurement  
6. Account  
7. Main content  

---

## 5. Accessibility Blueprint

| Topic | Rule |
| --- | --- |
| Skip link | First focusable control |
| Landmarks | `banner`, labelled `navigation`, `main`, `contentinfo` |
| Mega menu | `aria-expanded` / `aria-controls`; panel as dialog or labelled region; all items focusable |
| Drawer | Dialog or complementary; `aria-modal` when dialog; labelled title |
| Bottom nav | `nav` with `aria-label`; `aria-current="page"` on current |
| Breadcrumbs | `nav aria-label="Breadcrumb"`; list; current `aria-current` |
| Touch | ≥44px; no hover-only submenus |
| Reduced motion | Instant open/close equivalents |
| One overlay | Only one modal-layer (mega **or** drawer **or** search panel) owns focus |

---

## 6. Motion Blueprint

| Moment | Duration | Rule |
| --- | --- | --- |
| Header stick | 0–120ms | Border/elevation; compress without jump |
| Mega panel | 180–240ms | Opacity + 8–12px; exit faster |
| Drawer | 240–320ms | Edge translate + opacity; backdrop 160–200ms |
| Category accordion | ≤180ms | Height/opacity; instant if reduced motion |
| Bottom nav indicator | 120–180ms | Move/fade - **no bounce** |
| Forbidden | - | Hover-only mega; parallax header; competing FAB motion |

Aligns with Motion Design System: transform/opacity only; ≤320ms ordinary UI.

---

## 7. Implementation Strategy

| Step | Work |
| --- | --- |
| 1 | Freeze IA labels to Public Website Masterplan |
| 2 | NavShell tokens: heights, z-index, sticky offsets, safe areas |
| 3 | Header + Request + shared SearchCombobox |
| 4 | Mega menu click/keyboard + category panels |
| 5 | Mobile drawer + collapsible categories + scroll lock |
| 6 | Breadcrumbs from route config |
| 7 | Footer map + HAQQ TECH + legal |
| 8 | Client-only bottom nav (separate app shell) |
| 9 | A11y audit: focus, expanded, Esc, return focus |
| 10 | Perf: no sticky CLS; defer mega imagery |

### Z-index stack

Content → Sticky header → Mega/Drawer → Search panel → Cookie/toast  

### Reject

- Hover-only mega menus  
- Dual FAB + header Request  
- Different mobile vs desktop labels  
- Bottom nav on public marketing site without product reason  

---

## 8. Related docs

- `docs/52` Public Website Masterplan  
- `docs/50` Enterprise Search UX  
- `docs/51` Attention & Hierarchy Laws  
- `docs/11` Motion Design System  

---

## STOP

Enterprise Navigation System blueprint complete. No React generated.
