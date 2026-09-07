# Phase 3 - Interactive Procurement Timeline

**Component:** `InteractiveProcurementTimeline`  
**Section:** `ProcurementWorkflowSection` (homepage)  
**Styles:** `procurement-timeline.css` (via `@hamd/ui/homepage.css`)

---

## 1. Mission delivered

Visual procurement journey so buyers immediately understand:

| Question | UI answer |
| --- | --- |
| Where am I? | Current step (`aria-current="step"`) + “Where you are” panel |
| What happens next? | Next stage title + stage-specific next hint |
| How long? | Expected duration + honest note (never a guarantee) |

### Stages (fixed IA)

1. Discover → 2. Browse → 3. Request → 4. Review → 5. Quotation → 6. Approval → 7. Payment → 8. Shipment → 9. Delivery

Payment copy is contractual settlement language - not marketplace checkout.

---

## 2. Implementation

```tsx
import {
  InteractiveProcurementTimeline,
  ProcurementWorkflowSection,
  defaultProcurementTimelineSteps,
} from "@hamd/ui/homepage";
import "@hamd/ui/homepage.css";

<InteractiveProcurementTimeline defaultStepId="request" onStepChange={(id, i) => …} />

<ProcurementWorkflowSection
  title="A transparent procurement journey"
  description="See where you are, what happens next, and expected duration."
  primaryCta={{ href: "/request", label: "Request Procurement" }}
  defaultStepId="request"
/>
```

Controlled mode: pass `currentStepId`.  
Custom copy: pass `steps` / `timelineSteps` matching `ProcurementTimelineStep`.

---

## 3. Motion documentation

| Motion | Spec | Purpose |
| --- | --- | --- |
| Progress fill | Width transition **220ms** ease-out | Shows journey completion to current step (tablet+) |
| Node / marker | Border, background, scale **220ms** | Selected + current emphasis |
| Detail panel | Fade + 4px rise **220ms** on step change | Confirms context update without theatre |
| Hover | Background only on mobile list nodes | Affordance |
| Loops / parallax | **None** | Journey is explanatory, not decorative |

**Reduced motion:** `prefers-reduced-motion: reduce` disables transitions and detail animation - state changes remain instant and clear.

**Performance:** transform/opacity/color only; no layout thrash; no Lottie.

---

## 4. Accessibility review

| Topic | Implementation | Verdict |
| --- | --- | --- |
| Structure | Ordered list of step controls + detail `role="region"` | **PASS** |
| Current step | `aria-current="step"` on active control | **PASS** |
| Live updates | Detail region `aria-live="polite"` + position text | **PASS** |
| Keyboard | Arrow keys, Home/End move focus + selection | **PASS** |
| Focus | Visible 2px focus ring; ≥44–48px targets | **PASS** |
| Status meaning | Not color-only - labels, check icon, “Step x of y” | **PASS** |
| Durations | Textual ranges + notes; not presented as SLAs | **PASS** |
| Dark mode | Token remap under `[data-theme="dark"]` | **PASS** |
| Screen readers | One step announced as current; panels named | **PASS** |

**Accessibility verdict:** GO for WCAG 2.2 AA floor.

**Follow-up (non-blocking):** optional `aria-controls` pairing if hosts nest multiple timelines on one page.

---

## 5. Responsive

| Breakpoint | Behavior |
| --- | --- |
| Mobile | Vertical step list; duration chip on each row; stacked detail panels |
| Tablet+ | Horizontal snap-scroll track + progress line; 3-column detail |
| Wide | Equal flex steps across the journey |

---

## 6. Testing

```bash
pnpm --filter @hamd/ui test
pnpm --filter @hamd/ui build
```

Coverage: nine stages, where/next/duration panels, keyboard nav, complete/current states, homepage section wiring.

---

## STOP

Interactive Procurement Timeline implemented with motion documentation and accessibility review.
