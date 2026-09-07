import { useEffect, useId, useRef } from "react";
import { cx } from "../utils/cx.js";
import { useOptionalGuidance } from "./guidance-context.js";
import { Spotlight, calloutLayout, useSpotlightTarget } from "./Spotlight.js";
import {
  needsWorkspaceDrawer,
  openWorkspaceDrawer,
  queryVisibleTourTarget,
} from "./tour-target.js";

export type TourRunnerProps = {
  className?: string | undefined;
};

/**
 * Interactive Product Tour runner - Next / Previous / Skip / Finish / Pause /
 * Resume / Restart / Don't show again, with keyboard and live regions.
 */
export function TourRunner({ className }: TourRunnerProps) {
  const guidance = useOptionalGuidance();
  const titleId = useId();
  const liveId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const activeTour = guidance?.activeTour ?? null;
  const activeStepIndex = guidance?.activeStepIndex ?? 0;
  const paused = guidance?.paused ?? false;
  const mode = guidance?.mode ?? "off";
  const actionSatisfied = guidance?.actionSatisfied ?? false;
  const step = activeTour?.steps[activeStepIndex];
  const rect = useSpotlightTarget(paused ? undefined : step?.targetSelector);
  const registerAction = guidance?.registerAction;
  const openHelpCenter = guidance?.openHelpCenter;
  const skipMissing = guidance?.nextStep;

  useEffect(() => {
    if (!step?.requireAction || paused) return;
    const selector = step.targetSelector;
    const eventName = step.actionEvent ?? "click";
    if (!selector) {
      registerAction?.("", eventName);
      return;
    }
    const el = document.querySelector(selector);
    if (!(el instanceof HTMLElement)) {
      registerAction?.(selector, eventName);
      return;
    }

    const handler = () => registerAction?.(selector, eventName);
    el.addEventListener(eventName, handler);
    if (eventName === "focus") {
      el.addEventListener("focusin", handler);
    }
    return () => {
      el.removeEventListener(eventName, handler);
      if (eventName === "focus") {
        el.removeEventListener("focusin", handler);
      }
    };
  }, [paused, registerAction, step]);

  useEffect(() => {
    if (!activeTour || paused) return;
    panelRef.current?.focus();
  }, [activeTour, activeStepIndex, paused]);

  useEffect(() => {
    if (!step?.targetSelector || paused || !skipMissing) return;
    let cancelled = false;
    const skipIfMissing = () => {
      if (cancelled) return;
      if (queryVisibleTourTarget(step.targetSelector)) return;
      skipMissing();
    };
    if (needsWorkspaceDrawer(step.targetSelector)) {
      openWorkspaceDrawer();
      const handle = window.setTimeout(skipIfMissing, 120);
      return () => {
        cancelled = true;
        window.clearTimeout(handle);
      };
    }
    skipIfMissing();
    return () => {
      cancelled = true;
    };
  }, [paused, skipMissing, step]);

  if (!guidance || !activeTour || !step || mode === "off") return null;

  const {
    nextStep,
    previousStep,
    skipTour,
    finishTour,
    pauseTour,
    resumeTour,
    restartCurrentTour,
    dontShowAgain,
  } = guidance;

  const total = activeTour.steps.length;
  const index = activeStepIndex + 1;
  const blocked = Boolean(step.requireAction && !actionSatisfied);
  const isLast = index >= total;
  const layout = calloutLayout(rect, step.placement ?? "auto");
  const waitForTarget = Boolean(step.targetSelector && !rect);

  if (paused) {
    return (
      <div className={cx("hamd-guide-tour hamd-guide-tour--paused", className)}>
        <div
          className="hamd-guide-tour__resume-chip"
          role="status"
          aria-live="polite"
        >
          <span>
            Tour paused · {activeTour.title} ({index}/{total})
          </span>
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--primary"
            onClick={resumeTour}
          >
            Resume
          </button>
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--ghost"
            onClick={skipTour}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("hamd-guide-tour", className)} role="presentation">
      <div className="hamd-guide-tour__scrim" aria-hidden="true" />
      <Spotlight
        targetSelector={step.targetSelector}
        placement={step.placement}
        pulse={mode === "training" || Boolean(step.requireAction)}
      />
      <div
        ref={panelRef}
        className={cx(
          "hamd-guide-tour__panel",
          layout.compactSheet && "hamd-guide-tour__panel--sheet",
          waitForTarget && "hamd-guide-tour__panel--pending",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={liveId}
        tabIndex={-1}
        data-placement={layout.placement}
        hidden={waitForTarget}
        style={layout.style}
      >
        {rect ? (
          <span className="hamd-guide-tour__arrow" data-placement={layout.placement} aria-hidden="true" />
        ) : null}
        <div className="hamd-guide-tour__progress" aria-hidden="true">
          <span
            className="hamd-guide-tour__progress-bar"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
        <p className="hamd-guide-tour__meta" id={liveId} aria-live="polite">
          {activeTour.title} · Step {index} of {total}
          {activeTour.version ? ` · v${activeTour.version}` : ""}
        </p>
        <h2 id={titleId} className="hamd-guide-tour__title">
          {step.title}
        </h2>
        <p className="hamd-guide-tour__body">{step.body}</p>
        {step.requireAction ? (
          <p className="hamd-guide-tour__action-hint" role="status">
            {actionSatisfied
              ? "Action completed - continue when ready."
              : (step.actionLabel ??
                "Complete the highlighted action to continue.")}
          </p>
        ) : null}
        {step.imageHref ? (
          <img
            className="hamd-guide-tour__image"
            src={step.imageHref}
            alt=""
          />
        ) : null}
        <div className="hamd-guide-tour__actions" role="toolbar" aria-label="Tour controls">
          <button
            type="button"
            className="hamd-guide-btn"
            onClick={previousStep}
            disabled={activeStepIndex === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--primary"
            onClick={isLast ? finishTour : nextStep}
            disabled={blocked}
            aria-disabled={blocked}
          >
            {isLast ? "Finish" : "Next"}
          </button>
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--ghost"
            onClick={pauseTour}
          >
            Pause
          </button>
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--ghost"
            onClick={restartCurrentTour}
          >
            Restart
          </button>
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--ghost"
            onClick={skipTour}
          >
            Skip
          </button>
          {openHelpCenter ? (
            <button
              type="button"
              className="hamd-guide-btn hamd-guide-btn--ghost"
              onClick={() => {
                pauseTour();
                openHelpCenter();
              }}
            >
              More tours
            </button>
          ) : null}
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--ghost"
            onClick={dontShowAgain}
          >
            Don&apos;t show again
          </button>
        </div>
        <p className="hamd-guide-tour__kbd-hint">
          Keyboard: ← → to navigate, Esc to pause, Ctrl/⌘+Shift+G for Help
        </p>
      </div>
    </div>
  );
}
