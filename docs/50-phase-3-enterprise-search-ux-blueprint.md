# Phase 3 - Enterprise Search UX Blueprint

**Brand:** Almahbub International  
**Module:** Enterprise Search  
**Deliverable:** Blueprint only. No React.

---

## 1. Mission

Design a search experience **better than standard ecommerce**: permission-aware, evidence-led, keyboard-first, and oriented to qualified procurement - not click-to-cart.

### Principles

1. **Evidence over shopping** - type, constraints, next action.  
2. **Permission before rank** - no restricted data in suggestions or hits.  
3. **Structured filters win** - facets authoritative; AI may propose text only.  
4. **Explain empty** - scope, refinements, Request Procurement.  
5. **One pattern** - combobox + results page share vocabulary and URL state.

---

## 2. Surfaces

| Surface | Audience | Behavior |
| --- | --- | --- |
| Global header search | Public + Client | Combobox across products, categories, suppliers (scoped), recent/saved/popular |
| Catalog search | Public + Client Discover | Same pattern, catalog-scoped; facets on results |
| Workspace / Ops search | Client + Ops | Exact codes outrank fuzzy text |
| Voice (future-ready) | Feature-flagged | Speech → same text field; no UX fork |

---

## 3. Instant search

| Rule | Spec |
| --- | --- |
| Debounce | 150–250ms; 0ms on Enter/select |
| Cancel stale | Abort in-flight requests on query change |
| Idle (0 chars) | Recent · Saved · Popular (auth-aware) |
| Short query | Exact/code/SKU boost |
| 3+ chars | Full grouped suggestions |
| Panel | Open once; 120–180ms; reduced motion instant |
| Limits | ≤6 items/group; always “View all results” when q ≥ 1 |

---

## 4. Autocomplete

| Group | Priority | Behavior |
| --- | --- | --- |
| Exact / code / SKU | Highest | Jump to entity or constrain results |
| Products | High | Name, manufacturer, key snippet |
| Categories | High | Taxonomy path; open or filter |
| Suppliers | Scoped | Public = fit/capability only; never bank/risk in public |
| Synonym / spell | Support | Selectable “Did you mean” - no silent rewrite |
| Knowledge / FAQ | Support | Published audience only |

**Hard rule:** Never leak drafts, costs, PII, private documents, or unpublished catalog items.

---

## 5. Results experience

| Element | Role | Spec |
| --- | --- | --- |
| **Grid** | Visual discovery | Product Card Grid; selection bar |
| **List** | Technical density | Product Card List / table |
| **Suggestions band** | Query help | Spellfix, related categories, saved-search match, Request CTA |
| **Filters** | Authoritative narrow | Server counts; chips; clear-all; URL state |
| **Sorting** | Explicit | Relevance (default), Name, Newest, MOQ, Lead time - **no fake price sort** |
| **Compare** | Decision | Max 4 compatible; live count |
| **Procurement** | Conversion | Request selected / request from intent / empty-state request |

### Filters

Category · Manufacturer/Brand · Country/origin · Certification · MOQ range · Lead-time range (indicative) · Availability confidence (not “In stock”) · Supplier (scoped) · Type tabs (Products / Categories / Suppliers / All)

### URL state

`q`, `types`, `filters`, `sort`, `view` (grid|list), `savedSearchId`, cursor - restorable and shareable when permitted.

---

## 6. Recent · Saved · Popular · Voice

| Feature | Scope | Rule |
| --- | --- | --- |
| Recent | Device/user | ≤8; removable; careful sync of sensitive ops queries |
| Saved | Authenticated | Name + query + filters + sort; private/org visibility |
| Popular | Curated + aggregate | Allow-listed for public; no rare internal leakage |
| Voice (future) | Feature flag | Mic inserts transcript; user edits; explicit start/stop; no auto-listen |

---

## 7. Accessibility

| Topic | Rule |
| --- | --- |
| Pattern | ARIA combobox + listbox for suggestions; results as document region |
| Keyboard | ↑↓, Enter, Esc, Tab to View all/filters; optional `/` to focus |
| Screen reader | Clear label; announce counts; group labels; filter change live regions |
| Focus | Select → navigate; View all → results H1; Esc restores input |
| Responsive | Mobile full-screen suggest sheet; filter/sort bottom sheet; sticky selection bar |
| Targets | ≥44px touch; AA contrast |

---

## 8. Interaction rationales

| Interaction | Why | UX | Performance |
| --- | --- | --- | --- |
| Type | Predict without navigate | Faster discovery | Debounce + abort + short TTL cache |
| Select suggestion | Jump/refine | Fewer dead ends | One nav or URL update |
| Apply facet | Trustworthy narrow | Honest counts | Server replace once |
| Sort | Expert control | Predictable order | No stagger |
| Save search | Repeat scopes | Power-user speed | Named POST + toast |
| Compare | Parallel evaluate | Better decisions | Client ≤4 |
| Request | Convert intent | Wizard handoff | Prefill; no price promise |
| Voice | Hands-free entry | Same pipeline | User gesture only |

---

## 9. States & motion

- **Loading:** suggest progress in panel; results skeleton; keep prior results until replace  
- **Empty:** explain scope, clear filters, suggest categories, offer Request  
- **Error:** message + retry + request ID  
- **Motion:** panel 120–180ms; **no result-item stagger**; reduced motion instant  

---

## 10. Vs ecommerce (summary)

| Ecommerce default | HAMD enterprise search |
| --- | --- |
| Price / stock / cart | MOQ / lead / source confidence / Request |
| Single product index | Products + categories + suppliers + knowledge (+ records in workspace) |
| Silent query rewrite | Explicit “Did you mean” |
| Open suggest data | Permission-scoped suggestions |
| Infinite SKU scroll | Cursor pagination + compare + saved scopes |

---

## STOP

Enterprise Search UX blueprint complete. No React generated.
