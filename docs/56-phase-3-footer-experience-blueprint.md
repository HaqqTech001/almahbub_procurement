# Phase 3 - Footer Experience Blueprint

**Brand:** Almahbub International  
**Attribution:** Powered by HAQQ TECH  
**Mission:** A footer worthy of an enterprise procurement platform  
**Deliverable:** Hierarchy · Spacing · Typography · Accessibility · Responsive · Performance. No React.

---

## 1. Doctrine

1. **Durable, not decorative** - Orientation, support, legal, contact - not a second homepage.  
2. **Mirror the journey** - Same IA labels as header/nav.  
3. **One quiet conversion** - Newsletter/Contact support intent; **Request Procurement** stays header-primary (footer may use a text link).  
4. **HAQQ TECH** - Always in the basebar; never louder than Almahbub.  
5. **Static-first** - Minimal JS; accordion only on small screens.

---

## 2. Structure

### Zones

| Zone | Includes | Job |
| --- | --- | --- |
| A · Identity | Company Information, Office Locations, Contact, Social | Who / where / reach |
| B · Navigate | Quick Links, Services, Industries, Products | Continue journey |
| C · Support | Help, Support, Legal | Resolve & comply |
| D · Nurture | Newsletter | Optional low-intent capture |
| E · Basebar | Copyright, Powered by HAQQ TECH, locale (future) | Attribution |

### Blocks

| Block | Content | Rule |
| --- | --- | --- |
| Company Information | Brand + one-line positioning | “Global procurement, local accountability” |
| Quick Links | Home, About, Track Shipment, Request Procurement, Sign in | Request as **text link**, not filled button |
| Services | Global Procurement, Import & Export, Logistics, Warehousing, Procurement Services, Global Sourcing | Match masterplan routes |
| Industries | Top 5–6 + View all | Cap list length |
| Products | Catalog, Categories, Featured (optional) | Discovery continuity |
| Help | Help Center, FAQ, Knowledge | Self-serve |
| Support | Contact + optional response-time note | Human path |
| Legal | Privacy, Terms, Cookies, Cookie settings | Required |
| Newsletter | Email, Subscribe, privacy note | Never visually outranks Request |
| Social Media | Real profiles only | Accessible names (“Almahbub on LinkedIn”) |
| Office Locations | City + short address; detail link | Honest locations only |
| Contact | Verified email/phone + Contact page | No invented channels |
| Copyright | © {year} Almahbub International | Basebar |
| Powered by HAQQ TECH | Text credit (± policy link) | Basebar 12–13px |

### Desktop wire order

1. Brand + company info + offices + contact + social  
2. Quick Links · Services · Industries · Products  
3. Help · Support · Legal · Newsletter  
4. Rule → © Almahbub International · **Powered by HAQQ TECH**

---

## 3. Hierarchy & typography

| Level | Element | Spec |
| --- | --- | --- |
| 1 | Brand / company name | 14–16px semibold |
| 2 | Column headings | 12–13px semibold (quiet label) |
| 3 | Link lists | 13–14px; 8–10px row gap |
| 4 | Meta (addresses, newsletter help) | 12–13px secondary |
| 5 | Basebar | 12px secondary |

Surface: deep navy or quiet elevated footer token; links AA contrast; gold unused except optional brand mark.

---

## 4. Spacing

| Token | Value |
| --- | --- |
| Footer padding Y | 48–64px desktop; 40–48px mobile |
| Column gap | 32–40px |
| Link stack gap | 8–10px |
| Before basebar | 24–32px + hairline rule |
| Basebar padding Y | 16–20px |
| Content max width | 1120–1200px (site grid) |

---

## 5. Accessibility

| Topic | Rule |
| --- | --- |
| Landmark | `contentinfo` |
| Structure | Link groups as lists; column titles associated |
| Social | Text name for every icon control |
| Newsletter | Visible label; announced errors; privacy link; no pre-checked marketing consent |
| Focus | Visible ring; column-wise then downward order |
| Contrast | AA on footer surface; links vs text distinguishable |
| Keyboard | All links and newsletter controls operable |

---

## 6. Responsive Behaviour

| Breakpoint | Behavior |
| --- | --- |
| ≥1200px | Multi-column: Identity + nav columns + support/newsletter |
| 768–1199px | 2×2 columns; newsletter full width below |
| &lt;768px | Accordion: Services, Industries, Products, Help, Legal; Identity + Contact always expanded; basebar stacked |
| Touch | ≥44px hit area via item padding |

---

## 7. Performance

| Area | Rule |
| --- | --- |
| Delivery | Footer in public shell SSR/SSG - no client fetch for link map |
| JS | Accordion progressive enhancement on small screens only |
| Assets | Inline/SVG social icons; no embeds |
| Newsletter | Async POST; below-fold - never on LCP path |
| Motion | Accordion ≤180ms; none elsewhere; reduced motion = instant |

---

## 8. Reject

- Filled Request button competing with header primary  
- Marquee partners/social  
- Fake office addresses or unverified social profiles  
- Heavy CMS widgets or chat embeds in footer critical path  

---

## STOP

Footer Experience blueprint complete. No React generated.
