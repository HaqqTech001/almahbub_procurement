import { useEffect, useId, useRef } from "react";
import { cx } from "../utils/cx.js";
import { useOptionalGuidance } from "./guidance-context.js";

export type WelcomeModalProps = {
  className?: string | undefined;
  brandName?: string | undefined;
  estimatedMinutes?: number | undefined;
};

/**
 * First-login welcome - Start / Skip / Never. Public pages never mount this.
 * Partner attribution is omitted (Brand Handbook §7.5 - not in modals).
 */
export function WelcomeModal({
  className,
  brandName = "Almahbub International",
  estimatedMinutes = 8,
}: WelcomeModalProps) {
  const guidance = useOptionalGuidance();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const welcomeOpen = guidance?.welcomeOpen ?? false;
  const completeWelcome = guidance?.completeWelcome;
  const tours = guidance?.tours ?? [];

  useEffect(() => {
    if (!welcomeOpen) return;
    const node = dialogRef.current;
    node?.focus();
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus?.();
  }, [welcomeOpen]);

  if (!guidance || !welcomeOpen || !completeWelcome) return null;

  const published = tours.filter((t) => t.status === "published").length;

  return (
    <div className={cx("hamd-guide-welcome", className)} role="presentation">
      <div className="hamd-guide-welcome__backdrop" aria-hidden="true" />
      <div
        ref={dialogRef}
        className="hamd-guide-welcome__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <p className="hamd-guide-welcome__eyebrow">Enterprise onboarding</p>
        <h2 id={titleId} className="hamd-guide-welcome__title">
          Welcome to {brandName}
        </h2>
        <p className="hamd-guide-welcome__body">
          Learn how to navigate procurement, commercial, logistics, and finance
          workflows with confidence - without interrupting your day-to-day work.
        </p>
        <ul className="hamd-guide-welcome__learn">
          <li>How to create and track procurement requests</li>
          <li>Where quotations, invoices, and shipments live</li>
          <li>How to use guide modes and the Learning Center</li>
        </ul>
        <p className="hamd-guide-welcome__meta">
          About {estimatedMinutes} minutes · {published} guided tours available
        </p>
        <div className="hamd-guide-welcome__actions">
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--primary"
            onClick={() => completeWelcome("start")}
          >
            Start Guided Tour
          </button>
          <button
            type="button"
            className="hamd-guide-btn"
            onClick={() => completeWelcome("skip")}
          >
            Skip for Now
          </button>
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--ghost"
            onClick={() => completeWelcome("never")}
          >
            Never Automatically Start Again
          </button>
        </div>
      </div>
    </div>
  );
}
