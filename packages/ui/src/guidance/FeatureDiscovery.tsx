import { useEffect, useState } from "react";
import { cx } from "../utils/cx.js";
import { useOptionalGuidance } from "./guidance-context.js";

const EMPTY_TIP_IDS: ReadonlySet<string> = new Set();

export type FeatureDiscoveryProps = {
  className?: string | undefined;
};

/**
 * One-time feature tips for the current page - shown once unless restarted.
 */
export function FeatureDiscovery({ className }: FeatureDiscoveryProps) {
  const guidance = useOptionalGuidance();
  const active = guidance?.active ?? false;
  const mode = guidance?.mode ?? "off";
  const tips = guidance?.tips ?? [];
  const currentPageKey = guidance?.currentPageKey;
  const dismissedTipIds = guidance?.dismissedTipIds ?? EMPTY_TIP_IDS;
  const dismissTip = guidance?.dismissTip;
  const activeTour = guidance?.activeTour ?? null;
  const [visibleId, setVisibleId] = useState<string | null>(null);

  useEffect(() => {
    if (!active || mode === "off" || activeTour || !currentPageKey) {
      setVisibleId(null);
      return;
    }
    const candidate = tips.find(
      (t) =>
        t.enabled &&
        t.pageKey === currentPageKey &&
        !dismissedTipIds.has(t.id),
    );
    setVisibleId(candidate?.id ?? null);
  }, [active, activeTour, currentPageKey, dismissedTipIds, mode, tips]);

  const tip = tips.find((t) => t.id === visibleId);
  if (!tip) return null;

  return (
    <aside
      className={cx("hamd-guide-tip", className)}
      role="status"
      aria-live="polite"
      data-guide-tip-active={tip.featureKey}
    >
      <div>
        <p className="hamd-guide-tip__eyebrow">Feature discovery</p>
        <h3>{tip.title}</h3>
        <p>{tip.body}</p>
      </div>
      <button
        type="button"
        className="hamd-guide-btn"
        onClick={() => dismissTip?.(tip.id)}
      >
        Got it
      </button>
    </aside>
  );
}
