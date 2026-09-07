# Page Attention & Hierarchy Laws

**Status:** Non-negotiable composition doctrine  
**Applies to:** Public Website, Client Workspace, Operations Console  
**Deliverable:** Blueprint only. No React.

---

## Four laws

1. **One primary action** - Each page (or major decision view) has exactly one dominant next step. Secondary actions exist but never match its visual weight.
2. **Never compete for attention** - Only one focal region at a time. No parallel equal CTAs, autoplay, toast storms, or dual filled buttons in the same decision band.
3. **Sections lead to the next** - Every section has one job and hands the eye forward. The page is a path, not a collage.
4. **Hierarchy without reading** - Squint test: brand/title, primary action, and key status remain obvious when body copy is unreadable.

---

## Squint test

| What must stand out | Answers |
| --- | --- |
| Largest / strongest identity | Where am I? |
| Strongest filled button or top attention item | What should I do? |
| Status / proof strip | Why trust or what’s urgent? |
| Secondary links / meta | Optional depth only |

**Fail condition:** Two equal-weight elements both answer “what should I do?”

---

## Section path

1. **Orient** - Where am I / what is this?  
2. **Trust or status** - Why believe / what’s the state?  
3. **Understand** - Offer, constraints, evidence  
4. **Decide** - Primary action  
5. **Recover** - Help, FAQ, secondary paths, footer  

Skip beats only when the page type doesn’t need them. Do not shuffle into a module collage.

---

## Visual weight scale

| Level | Treatment | Use |
| --- | --- | --- |
| Primary | Filled action color | The one next step |
| Secondary | Outline / ghost | Alternative safe path |
| Tertiary | Text link | Optional depth |
| Attention item | Quiet emphasis in queues | Ops/client “do this now” - still one per view |

---

## Primary action by page type

| Page | ONE primary | Secondary (quieter) |
| --- | --- | --- |
| Public Home | Request Procurement | Explore Services, Track, Newsletter |
| Service / Category | Request this path | Compare, browse |
| Product Detail | Request this product | Save, Compare, Share |
| Search Results | Open best match or Request from intent | Filter, sort, compare (bar after selection) |
| Wizard step | Continue / Submit | Back, Save draft |
| Client Dashboard | Resolve top attention item | View all, KPIs |
| Request / Quote Detail | Advance required decision | Message, Download, History |
| Ops Overview | Open top queue item | Reports, CMS |
| Ops Workbench | Apply permitted transition | Assign, comment, audit |

---

## Natural flow examples

- **Home:** Hero → trust → capability → process → proof → FAQ → Request band → Footer  
- **Product:** Identity → constraints → specs → certs → Request  
- **Dashboard:** Attention → supporting metrics → recent  
- **Ops:** Queues → workbench → charts later  

---

## Anti-patterns → fix

| Anti-pattern | Fix |
| --- | --- |
| Two filled primaries in one band | Demote one to secondary/ghost |
| Hero with Request + Sign up + Demo + Search equal | One primary; others quieter or later |
| Eight equal KPI cards above work | Attention first; KPIs secondary |
| Section that doesn’t change understanding or intent | Remove or merge |
| Toast + modal + page CTA competing | One feedback channel for the moment |
| Motion drawing eyes everywhere | One focal motion max; usually none |

---

## Allowed exceptions

- Destructive confirmation may temporarily own focus inside a dialog.  
- Multi-select action bars appear **after** selection - not as a second permanent primary.  
- Never ship permanent dual primaries on a page.

---

## Pre-ship checklist

- [ ] Squint test passes  
- [ ] Only one filled primary per decision area  
- [ ] Each section has one job and leads to the next  
- [ ] Mobile: primary reachable; full-width where intent peaks  
- [ ] Primary action in logical focus order; name describes outcome  
- [ ] Motion does not create a second focal point  

---

## STOP

These laws govern all subsequent page blueprints and UI implementation.
