import { useId } from "react";
import { HorizontalStepper } from "../primitives/HorizontalStepper.js";
import { cx } from "../utils/cx.js";
import {
  BUYER_JOURNEY_STAGES,
  buyerJourneyIndex,
  contextualLifecycleState,
  type RequestRelatedSummary,
} from "./lifecycle.js";

export type ProcurementProgressVariant = "full" | "compact" | "preview" | "wizard";

export type WizardProgressStep = {
  id: string;
  label: string;
  compactLabel?: string;
};

export type ProcurementProgressProps = {
  status?: string | undefined;
  related?: RequestRelatedSummary | null;
  variant?: ProcurementProgressVariant | undefined;
  className?: string | undefined;
  wizardSteps?: readonly WizardProgressStep[] | undefined;
  wizardIndex?: number | undefined;
  wizardErrorSteps?: readonly number[] | undefined;
  onWizardStepSelect?: ((index: number) => void) | undefined;
};

export function wizardProgressPercent(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  const current = Math.min(Math.max(0, currentIndex), total - 1);
  return Math.round(((current + 1) / total) * 100);
}

export function ProcurementProgress({
  status = "draft",
  related = null,
  variant = "full",
  className,
  wizardSteps,
  wizardIndex = 0,
  wizardErrorSteps,
  onWizardStepSelect,
}: ProcurementProgressProps) {
  const labelId = useId();
  if (variant === "wizard" && wizardSteps?.length) {
    const total = wizardSteps.length;
    const current = Math.min(Math.max(0, wizardIndex), total - 1);
    return (
      <div className={cx("hamd-progress", "hamd-progress--wizard", className)}>
        <HorizontalStepper steps={wizardSteps} currentStep={current} errorSteps={wizardErrorSteps} onStepSelect={onWizardStepSelect} label="Request steps" />
      </div>
    );
  }

  const current = buyerJourneyIndex(status, related);
  const context = contextualLifecycleState(status);
  const percent =
    BUYER_JOURNEY_STAGES.length <= 1
      ? 100
      : (current / (BUYER_JOURNEY_STAGES.length - 1)) * 100;
  const currentLabel = BUYER_JOURNEY_STAGES[current]?.label ?? "Submitted";
  const compact = variant === "compact";

  return (
    <div
      className={cx(
        "hamd-progress",
        compact && "hamd-progress--compact",
        variant === "preview" && "hamd-progress--preview",
        className,
      )}
    >
      <p className="hamd-sr-only" id={labelId}>
        {status === "draft"
          ? `Expected journey. Current stage ${currentLabel}.`
          : `Request progress. Current stage ${currentLabel}.`}
        {context ? ` ${context.label}.` : ""}
      </p>
      {context ? (
        <p className={cx("hamd-progress__context", `hamd-progress__context--${context.tone}`)}>
          {context.label}
        </p>
      ) : null}
      {compact ? (
        <p className="hamd-progress__compact-label">
          {currentLabel}
          <span>
            {current + 1} of {BUYER_JOURNEY_STAGES.length}
          </span>
        </p>
      ) : null}
      <div
        className="hamd-progress__track"
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={BUYER_JOURNEY_STAGES.length - 1}
        aria-valuenow={current}
        aria-valuetext={currentLabel}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <ol className="hamd-progress__nodes">
        {BUYER_JOURNEY_STAGES.map((stage, index) => (
          <li
            key={stage.id}
            className={cx(
              "hamd-progress__node",
              index < current && "is-complete",
              index === current && "is-current",
            )}
          >
            <span className="hamd-progress__dot" />
            <span className="hamd-progress__node-label">{stage.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
