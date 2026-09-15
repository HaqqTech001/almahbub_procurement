import { useEffect, useRef, type CSSProperties } from "react";
import { cx } from "../utils/cx.js";

export type HorizontalStep = {
  id: string;
  label: string;
  compactLabel?: string;
};
export type HorizontalStepperProps = {
  steps: readonly HorizontalStep[];
  currentStep: number;
  completedSteps?: readonly number[] | undefined;
  errorSteps?: readonly number[] | undefined;
  onStepSelect?: ((index: number) => void) | undefined;
  label?: string | undefined;
  className?: string | undefined;
};

/** Navigation is deliberately limited to completed steps before the current one. */
export function HorizontalStepper({
  steps,
  currentStep,
  completedSteps,
  errorSteps = [],
  onStepSelect,
  label = "Progress",
  className,
}: HorizontalStepperProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const current = Number.isFinite(currentStep)
    ? Math.max(0, Math.min(Math.trunc(currentStep), steps.length - 1))
    : 0;
  useEffect(() => {
    const container = viewport.current;
    const item = container?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!container || !item || container.scrollWidth <= container.clientWidth)
      return;
    const bounds = container.getBoundingClientRect();
    const target = item.getBoundingClientRect();
    // Scroll only the stepper, never the surrounding form or page.
    if (target.left < bounds.left || target.right > bounds.right) {
      container.scrollBy?.({
        left: target.left - bounds.left - (bounds.width - target.width) / 2,
        behavior: "auto",
      });
    }
  }, [current, steps.length]);
  if (!steps.length) return null;
  const isComplete = (index: number) =>
    (completedSteps ? completedSteps.includes(index) : index < current) &&
    !errorSteps.includes(index);
  return (
    <div
      ref={viewport}
      className={cx(
        "hamd-horizontal-stepper",
        steps.length > 5 && "hamd-horizontal-stepper--scroll",
        className,
      )}
    >
      <ol
        aria-label={label}
        style={{ "--step-count": steps.length } as CSSProperties}
      >
        {steps.map((step, index) => {
          const error = errorSteps.includes(index);
          const active = index === current;
          const complete = isComplete(index) && !active;
          const state = error
            ? "error"
            : active
              ? "current"
              : complete
                ? "completed"
                : "upcoming";
          const name = `${step.label}, step ${index + 1} of ${steps.length}, ${active && error ? "current, " : ""}${state}`;
          const content = (
            <>
              <span
                className="hamd-horizontal-stepper__label"
                aria-hidden="true"
              >
                {step.compactLabel ?? step.label}
              </span>
              <span
                className="hamd-horizontal-stepper__circle"
                aria-hidden="true"
              >
                {error ? "!" : complete ? "\u2713" : index + 1}
              </span>
            </>
          );
          return (
            <li
              key={step.id}
              data-state={state}
              data-connected={isComplete(index) ? "true" : undefined}
              aria-current={active ? "step" : undefined}
            >
              {index < steps.length - 1 ? (
                <span
                  className="hamd-horizontal-stepper__connector"
                  aria-hidden="true"
                />
              ) : null}
              {index < current && (complete || error) && onStepSelect ? (
                <button
                  type="button"
                  className="hamd-horizontal-stepper__step"
                  aria-label={name}
                  title={step.label}
                  onClick={() => onStepSelect(index)}
                >
                  {content}
                </button>
              ) : (
                <span
                  className="hamd-horizontal-stepper__step"
                  aria-label={name}
                  role="img"
                  title={step.label}
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
