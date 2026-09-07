# Phase 3 - Universal Search Blueprint

**Product:** HAMD Genesis / Almahbub International  
**Mission:** Global search available throughout the platform  
**Deliverable:** Architecture · Interaction rules · Accessibility · Performance. No React.

---

## 1. Mission & principles

Universal Search is one **search verb** everywhere: Public header, Client workspace, Ops console, Catalog, and Help.

| Principle | Meaning |
| --- | --- |
| One search verb | Same combobox pattern; scope changes, interaction does not |
| Permission before rank | No suggestion or hit the user cannot open |
| Type is visible | Entity type, label, next action on every result |
| Filters are truth | Advanced filters authoritative; AI proposes text only |
| Recover always | Empty / no-result states explain scope and offer next steps |

**Relationship:** `docs/50` (Enterprise Search UX) = catalog-led discovery UX. **This doc** = platform-wide architecture + entity coverage + future adapters. `docs/34` = backend search platform.

---

## 2. Search Architecture

### Entry points

- Header **Command Search** (all shells)  
- Catalog search  
- Help Center search  
- Ops global search  
- Optional `/` hotkey (when not typing in a field)

### Shared contract

```text
GET /api/v1/search?q=&scope=&types=&filters=&sort=&cursor=&pageSize=
```

Response: typed hits, highlights, facets, cursor, spell/synonym suggestions, permission-safe snippets.

### Pipeline

```text
User → UI Combobox/Results
     → Search API
     → Policy scope builder (tenant/org/role/relationship/classification)
     → Query parse (+ optional AI propose / semantic recall - flagged)
     → Index projection
     → Rank + diversify
     → Accessible response
```

Indexes are projections; **source records remain truth**. Index via domain outbox workers.

### Scopes (same UI, different allow-lists)

| Scope | Typical entities |
| --- | --- |
| `public` | Products, Categories, Manufacturers, Services, FAQs, published Knowledge; Suppliers fit-only; **no Documents** |
| `catalog` | Products, Categories, Manufacturers (+ scoped suppliers) |
| `help` | Knowledge, FAQs |
| `workspace` | Public catalog types + org documents + request/quote/shipment codes |
| `ops` | Full operational types per RBAC |

### Suggest vs results

| Mode | Behavior |
| --- | --- |
| Autocomplete panel | Grouped ≤6 per type; exact/code first |
| Results page | Cursor pagination, facets, grid/list, compare/request where product-scoped |

---

## 3. Entity support

| Entity | Visibility | Safe indexed fields | Primary next action |
| --- | --- | --- | --- |
| Products | Public, Client | Name, SKU, manufacturer, specs, origin | Request / Open detail |
| Categories | Public, Client | Path, description | Browse category |
| Manufacturers | Public, Client | Name, linked product signal | View / filter |
| Suppliers | Scoped | Public fit/capability; ops risk/bank restricted | View fit / prefer in request |
| Services | Public | Title, outcome | Open service / Request |
| Knowledge Base | Audience-scoped | Published articles | Open article |
| FAQs | Public + Help | Question/answer | Expand / open |
| Documents | Authorized only | Title, type, linked record | Open if permitted - **never public suggest** |

---

## 4. Features

| Feature | Rule |
| --- | --- |
| Autocomplete | Debounce 150–250ms; abort stale; type groups; exact/code/SKU highest |
| Recent Searches | ≤8; removable; scope-aware; don’t leak ops queries to public devices |
| Saved Searches | Auth: name + q + types + filters + sort; private/org visibility |
| Trending Searches | Curated/allow-listed; public-safe aggregates only |
| Keyboard Navigation | Combobox ↑↓ Enter Esc Tab; `/` focuses; no trap |
| Advanced Filters | Per-type facets; URL state; server counts; clear-all |
| Search Suggestions | Explicit “Did you mean”; related categories; saved-search match |
| Empty States | Idle shows recent/saved/trending; helpful zero-query copy |
| No Results Recovery | Explain scope; clear filters; suggest other types; **Request Procurement** / Contact |

### Advanced filters (examples by type)

- **Products:** category, manufacturer, country, certification, MOQ, lead time, availability confidence  
- **Services:** service family  
- **Knowledge/FAQ:** topic, audience  
- **Documents (auth):** type, linked domain, date - never in public  
- **Suppliers (scoped):** country, capability - risk filters ops-only  

**Sorting:** Relevance default; never fake public “price low–high.”

---

## 5. Future ready

| Capability | Rule |
| --- | --- |
| **AI Search** | Propose rewritten query + rationale; **user confirms**; never auto-submit; never bypass filters/permissions; never choose supplier |
| **Voice Search** | Explicit mic start/stop; transcript into same field; user edits before search; no auto-listen |
| **Semantic Search** | Vector recall blended with keyword; label “meaning match”; timeout/cold → keyword fallback |

All three share the **same response shape** and UI; feature-flagged adapters only.

---

## 6. Interaction Rules

| Interaction | Why | UX improvement | Performance |
| --- | --- | --- | --- |
| Open search | Predict without leaving | Fast orientation | Mount once; lazy suggest |
| Type | Instant suggest | Fewer dead queries | Debounce + abort + short TTL |
| Select entity | Jump to record | Short path | One navigation |
| View all results | Full refinement | Power tools | Results route |
| Apply filter | Authoritative narrow | Trustworthy counts | Replace once; no stagger |
| Save search | Repeat scope | Expert speed | POST + toast |
| AI propose | Assist formulation | Control retained | Async; cancellable |
| Voice | Hands-free entry | Same pipeline | User gesture only |

---

## 7. Accessibility

| Topic | Rule |
| --- | --- |
| Pattern | ARIA combobox + listbox; visible group labels |
| Name | Scope-specific label (e.g. “Search products, services, and help”) |
| Keyboard | ↑↓ Enter Esc Tab; return focus on close |
| Live regions | Polite suggest status; results count on commit; filter changes |
| Documents | Never announce inaccessible titles |
| Mobile | Full-screen suggest sheet; filter bottom sheet; ≥44px |
| Reduced motion | Instant panel; no result cascade |
| Overlay | One search layer at a time vs mega/drawer (nav z-index rules) |

---

## 8. Performance Strategy

| Area | Rule |
| --- | --- |
| Budget | Suggest UI feedback &lt; 100ms; suggest API p95 target &lt; 200ms with cache |
| Network | `AbortController`; coalesce identical in-flight queries |
| Cache | Short TTL for public suggest where policy-safe; no cache of personalized restricted hits on shared CDN blindly |
| Payload | Suggest: id, type, label, crumb, safe snippet only |
| Rendering | Virtualize long lists; keep prior results until replace; skeleton matches grid/list |
| Indexing | Async workers; never block writes |
| AI / Semantic | Lazy clients; hard timeout → keyword; degrade gracefully |
| Rate limit | Per-user/IP; clear backoff messaging |

---

## 9. Implementation notes

1. Ship **keyword + filters + permissions** first.  
2. Reuse one `SearchCombobox` + `SearchResults` across shells with `scope` prop.  
3. Add Saved/Trending after auth and allow-lists.  
4. Flag AI / Voice / Semantic behind adapters with identical contracts.  
5. Align nav Command Search (`docs/53`) to this architecture.

---

## STOP

Universal Search blueprint complete. No React generated.
