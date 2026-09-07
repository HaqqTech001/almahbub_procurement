import { useCallback, useEffect, useId, useState, type KeyboardEvent } from "react";
import { cx } from "../utils/cx.js";

export type TimelineStepStatus = "complete" | "current" | "upcoming";

export type ProcurementTimelineStep = {
  id: string;
  title: string;
  /** Short summary of this stage */
  description: string;
  /** What the buyer should expect next after this stage */
  nextHint: string;
  /** Honest duration range - never a guarantee */
  duration: string;
  /** Optional note under duration (e.g. “indicative”) */
  durationNote?: string;
};

export type InteractiveProcurementTimelineProps = {
  steps?: readonly ProcurementTimelineStep[];
  /** Controlled current step id */
  currentStepId?: string;
  /** Uncontrolled initial step id */
  defaultStepId?: string;
  onStepChange?: (stepId: string, index: number) => void;
  className?: string;
  /** Visually emphasize progress up to the current step */
  showProgress?: boolean;
  label?: string;
};

export const defaultProcurementTimelineSteps: readonly ProcurementTimelineStep[] = [
  {
    id: "discover",
    title: "Discover",
    description: "Understand Almahbub capabilities, corridors, and how accountable procurement works.",
    nextHint: "Move into the catalog to identify candidate products or categories.",
    duration: "Same day",
    durationNote: "Self-serve",
  },
  {
    id: "browse",
    title: "Browse",
    description: "Explore categories and featured items with MOQ and lead-time context - not live checkout stock.",
    nextHint: "Start a procurement request with product identity preserved.",
    duration: "1–2 hours",
    durationNote: "Typical browsing session",
  },
  {
    id: "request",
    title: "Request",
    description: "Capture requirements, quantities, destinations, and constraints into a governed request record.",
    nextHint: "A specialist reviews completeness and may ask clarifying questions.",
    duration: "15–45 min",
    durationNote: "To submit a complete request",
  },
  {
    id: "review",
    title: "Review",
    description: "Specs, commercial context, and documentation needs are clarified with a named owner.",
    nextHint: "Qualified sourcing begins once the request is clear enough to quote.",
    duration: "1–3 business days",
    durationNote: "Depends on specification complexity",
  },
  {
    id: "quotation",
    title: "Quotation",
    description: "Documented quotations are prepared with commercial evidence you can verify.",
    nextHint: "Compare quotes and proceed to approval with the record intact.",
    duration: "2–5 business days",
    durationNote: "Service expectation, not a guarantee",
  },
  {
    id: "approval",
    title: "Approval",
    description: "Decide against evidence on the record - approve, revise, or decline with a clear owner.",
    nextHint: "Commercial settlement terms are confirmed before fulfillment starts.",
    duration: "1–5 business days",
    durationNote: "Buyer-side decision window",
  },
  {
    id: "payment",
    title: "Payment",
    description: "Settle against agreed commercial terms. Payment is contractual fulfillment - not marketplace checkout.",
    nextHint: "Procurement advances to shipment planning once settlement conditions are met.",
    duration: "Per agreed terms",
    durationNote: "Varies by contract",
  },
  {
    id: "shipment",
    title: "Shipment",
    description: "Logistics execute with honest ETA ranges and exception ownership when plans change.",
    nextHint: "Track milestones through to delivery confirmation.",
    duration: "Corridor-dependent",
    durationNote: "Published as a range on the record",
  },
  {
    id: "delivery",
    title: "Delivery",
    description: "Goods arrive against the agreed plan; the journey closes with verifiable delivery evidence.",
    nextHint: "Request support or start a follow-on procurement from the same accountable process.",
    duration: "At ETA window",
    durationNote: "Confirmed on delivery record",
  },
] as const;

function statusForIndex(index: number, currentIndex: number): TimelineStepStatus {
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "current";
  return "upcoming";
}

/**
 * Interactive procurement journey - where you are, what happens next, expected duration.
 */
export function InteractiveProcurementTimeline({
  steps = defaultProcurementTimelineSteps,
  currentStepId,
  defaultStepId,
  onStepChange,
  className,
  showProgress = true,
  label = "Procurement journey",
}: InteractiveProcurementTimelineProps) {
  const baseId = useId();
  const initialId = defaultStepId ?? steps[0]?.id ?? "";
  const [uncontrolledId, setUncontrolledId] = useState(initialId);
  const activeId = currentStepId ?? uncontrolledId;
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeId),
  );
  const current = steps[currentIndex] ?? steps[0];
  const next = steps[currentIndex + 1];
  const progress = steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 0;

  const selectStep = useCallback(
    (stepId: string, index: number) => {
      if (currentStepId === undefined) {
        setUncontrolledId(stepId);
      }
      onStepChange?.(stepId, index);
    },
    [currentStepId, onStepChange],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (steps.length === 0) return;
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (index + 1) % steps.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (index - 1 + steps.length) % steps.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = steps.length - 1;
    } else {
      return;
    }
    const step = steps[nextIndex];
    if (!step) return;
    selectStep(step.id, nextIndex);
    const target = document.getElementById(`${baseId}-step-${step.id}`);
    target?.focus();
  };

  useEffect(() => {
    if (currentStepId !== undefined) return;
    if (!steps.some((step) => step.id === uncontrolledId) && steps[0]) {
      setUncontrolledId(steps[0].id);
    }
  }, [currentStepId, steps, uncontrolledId]);

  if (!current) {
    return null;
  }

  const detailId = `${baseId}-detail`;

  return (
    <div
      className={cx("hamd-timeline", className)}
      data-testid="interactive-procurement-timeline"
    >
      <div className="hamd-timeline__track-wrap">
        {showProgress ? (
          <div
            className="hamd-timeline__progress"
            aria-hidden="true"
            style={{ ["--hamd-timeline-progress" as string]: `${progress}%` }}
          />
        ) : null}

        <ol className="hamd-timeline__steps" aria-label={label}>
          {steps.map((step, index) => {
            const status = statusForIndex(index, currentIndex);
            const selected = step.id === current.id;
            return (
              <li
                key={step.id}
                className={cx(
                  "hamd-timeline__step",
                  `hamd-timeline__step--${status}`,
                  selected && "is-selected",
                )}
              >
                <button
                  id={`${baseId}-step-${step.id}`}
                  type="button"
                  className="hamd-timeline__node"
                  aria-current={selected ? "step" : undefined}
                  aria-describedby={selected ? detailId : undefined}
                  onClick={() => selectStep(step.id, index)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  <span className="hamd-timeline__marker" aria-hidden="true">
                    {status === "complete" ? (
                      <svg viewBox="0 0 16 16" className="hamd-timeline__check" focusable="false">
                        <path
                          d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span className="hamd-timeline__index">{index + 1}</span>
                    )}
                  </span>
                  <span className="hamd-timeline__label">{step.title}</span>
                  <span className="hamd-timeline__duration-chip">{step.duration}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div
        id={detailId}
        className="hamd-timeline__detail"
        role="region"
        aria-live="polite"
        aria-label={`${current.title}: current stage details`}
      >
        <div className="hamd-timeline__detail-grid">
          <div className="hamd-timeline__panel hamd-timeline__panel--now">
            <p className="hamd-timeline__panel-eyebrow">Where you are</p>
            <h3 className="hamd-timeline__panel-title">{current.title}</h3>
            <p className="hamd-timeline__panel-body">{current.description}</p>
          </div>

          <div className="hamd-timeline__panel hamd-timeline__panel--next">
            <p className="hamd-timeline__panel-eyebrow">What happens next</p>
            <h3 className="hamd-timeline__panel-title">
              {next ? next.title : "Journey complete"}
            </h3>
            <p className="hamd-timeline__panel-body">
              {next ? current.nextHint : current.nextHint}
            </p>
          </div>

          <div className="hamd-timeline__panel hamd-timeline__panel--duration">
            <p className="hamd-timeline__panel-eyebrow">Expected duration</p>
            <p className="hamd-timeline__panel-metric">{current.duration}</p>
            {current.durationNote ? (
              <p className="hamd-timeline__panel-note">{current.durationNote}</p>
            ) : null}
          </div>
        </div>

        <p className="hamd-timeline__position" aria-live="polite">
          Step {currentIndex + 1} of {steps.length}
          {next ? ` · Next: ${next.title}` : " · Final stage"}
        </p>
      </div>
    </div>
  );
}
