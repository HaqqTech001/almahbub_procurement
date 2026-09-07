# Project Identity Charter

**Product:** HAMD Genesis  
**Public brand:** Almahbub International  
**Technology partner:** HAQQ TECH  
**Status:** Normative - binds all design and implementation decisions  
**Version:** 1.0

---

## 1. Identity

This project is **not** just a procurement website.

It is the **flagship digital platform of Almahbub International**, powered by **HAQQ TECH**.

It must become **one of the highest-quality procurement systems in Africa**.

Every experience must feel **premium, intentional, and timeless**.

**Do not implement average interfaces.**

---

## 2. Decision pillars

Every implementation decision must improve one or more of the following - and must not degrade the others without an explicit, accepted trade-off:

| Pillar | Bar |
| --- | --- |
| **User Experience** | One primary action; clear next step; calm procurement journeys |
| **Accessibility** | WCAG 2.2 AA floor; keyboard, focus, labels, reduced motion as acceptance criteria |
| **Performance** | Fast LCP; near-zero CLS on heroes; lean payloads; motion never blocks tasks |
| **Security** | Trust before shipping speed; strong auth; RBAC; money/approvals never chat-only |
| **Maintainability** | Tokens, shared components, typed contracts; leave systems clearer than found |
| **Scalability** | Modular monolith default; event/projection patterns; policy-gated transitions |
| **Brand Perception** | Evidence over claims; navy calm authority; documentary craft; HAQQ TECH credited quietly |

---

## 3. Modernize without breaking workflows

**Preserve** successful business functionality wherever possible:

- Auth lifecycle  
- Browse → create request  
- Track my request  
- Reach support  
- Admin triage of requests  
- Notifications unread habit  

**Upgrade** structure and craft:

- Three shells (Public / Client / Ops)  
- Procurement vocabulary  
- Design system and attention laws  
- Queue-first operations  
- Evidence-led trust  

**Replace** harmful patterns:

- Cart / order ecommerce metaphors  
- Unrestricted status controls  
- Vanity KPI-first ops home  
- Legacy SPAs as the long-term product UI  

Detail: `docs/57-pre-implementation-review-and-design-decision-log.md`

---

## 4. Implementation gate

Before merging or shipping any screen or interaction:

1. Does it feel average? → **Reject / raise craft**  
2. Does it break a successful workflow without a parity path? → **Reject**  
3. Does it improve at least one pillar without silent harm to others? → **Required**  
4. Does it align with Product DNA (`docs/06`) and Engineering Constitution (`docs/33`)? → **Required**  
5. Does it pass attention laws (`docs/51`: one primary action, squint test)? → **Required**  

---

## 5. Authority stack

When documents conflict, resolve in this order (subject to law and the Engineering Constitution’s own supremacy clause):

1. `docs/33` HAMD Engineering Constitution  
2. `docs/06` HAMD Product DNA  
3. **This Project Identity Charter**  
4. `docs/57` Design Decision Log  
5. Phase blueprints (UX, motion, public masterplan, etc.)  

---

## 6. Brand line

**Almahbub International** - public brand and accountable partner.  
**Powered by HAQQ TECH** - platform engineering attribution; footer-level only (public footer; client footer/About; ops footer/System Information; optional email footer). Never in heroes, headers, dashboards, forms, cards, modals, loading screens, or prominent auth chrome. Never louder than Almahbub.

**Promise:** International procurement that feels calm, clear, and controlled.

---

## STOP

Identity charter locked. All subsequent implementation must honor it.
