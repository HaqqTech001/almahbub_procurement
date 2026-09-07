import { useEffect, useState } from "react";
import { cx } from "../utils/cx.js";
import { useOptionalGuidance } from "./guidance-context.js";

export type SmartHelpProps = {
  className?: string | undefined;
};

type HelpPayload = {
  title: string;
  purpose: string;
  when: string;
  outcome: string;
};

/**
 * Hover/focus smart help for `[data-guide-help]` controls when Guided/Training is on.
 * Expected attributes: data-guide-help-title, -purpose, -when, -outcome
 */
export function SmartHelp({ className }: SmartHelpProps) {
  const guidance = useOptionalGuidance();
  const active = guidance?.active ?? false;
  const mode = guidance?.mode ?? "off";
  const activeTour = guidance?.activeTour ?? null;
  const [help, setHelp] = useState<HelpPayload | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!active || mode === "off" || activeTour) {
      setHelp((prev) => (prev === null ? prev : null));
      return;
    }

    const read = (el: Element | null): HelpPayload | null => {
      if (!(el instanceof HTMLElement)) return null;
      const host = el.closest("[data-guide-help]") as HTMLElement | null;
      if (!host) return null;
      return {
        title: host.dataset.guideHelpTitle ?? "Help",
        purpose: host.dataset.guideHelpPurpose ?? "",
        when: host.dataset.guideHelpWhen ?? "",
        outcome: host.dataset.guideHelpOutcome ?? "",
      };
    };

    const show = (event: Event) => {
      const target = event.target as Element | null;
      const payload = read(target);
      if (!payload) return;
      const host = (target as HTMLElement).closest(
        "[data-guide-help]",
      ) as HTMLElement;
      const r = host.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2, y: r.bottom + 8 });
      setHelp(payload);
    };
    const hide = () => setHelp((prev) => (prev === null ? prev : null));

    document.addEventListener("mouseover", show);
    document.addEventListener("focusin", show);
    document.addEventListener("mouseout", hide);
    document.addEventListener("focusout", hide);
    return () => {
      document.removeEventListener("mouseover", show);
      document.removeEventListener("focusin", show);
      document.removeEventListener("mouseout", hide);
      document.removeEventListener("focusout", hide);
    };
  }, [active, activeTour, mode]);

  if (!help) return null;

  return (
    <div
      className={cx("hamd-guide-smart", className)}
      role="tooltip"
      style={{ left: pos.x, top: pos.y }}
    >
      <strong>{help.title}</strong>
      {help.purpose ? <p><span>Purpose</span> {help.purpose}</p> : null}
      {help.when ? <p><span>When</span> {help.when}</p> : null}
      {help.outcome ? <p><span>Outcome</span> {help.outcome}</p> : null}
    </div>
  );
}
