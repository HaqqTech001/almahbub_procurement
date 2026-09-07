import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { cx } from "../utils/cx.js";
import type { GuidancePlacement } from "./types.js";
import {
  TOUR_PAD_PX,
  measureTourTarget,
  needsWorkspaceDrawer,
  openWorkspaceDrawer,
  queryVisibleTourTarget,
} from "./tour-target.js";

export type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type SpotlightProps = {
  targetSelector?: string | undefined;
  placement?: GuidancePlacement | undefined;
  pulse?: boolean | undefined;
  className?: string | undefined;
};

export function useSpotlightTarget(targetSelector?: string) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useLayoutEffect(() => {
    if (!targetSelector) {
      setRect(null);
      return undefined;
    }
    let cancelled = false;
    const update = () => {
      const next = measureTourTarget(targetSelector);
      if (cancelled) return;
      setRect((prev) => {
        if (!prev && !next) return prev;
        if (
          prev &&
          next &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.height === next.height
        ) {
          return prev;
        }
        return next ? { top: next.top, left: next.left, width: next.width, height: next.height } : null;
      });
    };

    if (needsWorkspaceDrawer(targetSelector)) {
      openWorkspaceDrawer();
      window.setTimeout(update, 80);
    }
    update();

    const el = queryVisibleTourTarget(targetSelector);
    const ro = el && "ResizeObserver" in window ? new ResizeObserver(update) : null;
    if (el) ro?.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("scroll", update, true);
    const drawer = document.querySelector(".hamd-client-shell__drawer");
    drawer?.addEventListener("transitionend", update);
    return () => {
      cancelled = true;
      ro?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("scroll", update, true);
      drawer?.removeEventListener("transitionend", update);
    };
  }, [targetSelector]);

  useEffect(() => {
    const el = queryVisibleTourTarget(targetSelector);
    el?.scrollIntoView?.({ block: "center", inline: "nearest", behavior: "smooth" });
  }, [targetSelector]);

  return rect;
}

export function Spotlight({
  targetSelector,
  pulse = true,
  className,
}: SpotlightProps) {
  const rect = useSpotlightTarget(targetSelector);
  if (!rect) return null;
  const pad = TOUR_PAD_PX;
  return (
    <div
      className={cx(
        "hamd-guide-spotlight",
        pulse && "hamd-guide-spotlight--pulse",
        className,
      )}
      aria-hidden="true"
      style={{
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }}
    />
  );
}

export type CalloutLayout = {
  style: CSSProperties;
  placement: GuidancePlacement;
  compactSheet: boolean;
};

export function calloutLayout(
  rect: SpotlightRect | null,
  placement: GuidancePlacement = "auto",
): CalloutLayout {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const compactSheet = vw <= 480;
  const panelW = Math.min(28 * 16, vw - 24);
  const panelH = compactSheet ? Math.min(240, vh * 0.42) : 220;
  const margin = 12;
  const footerReserve = 72;

  if (!rect) {
    return {
      placement: "bottom",
      compactSheet: true,
      style: {
        position: "fixed",
        left: margin,
        right: margin,
        bottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`,
        top: "auto",
        width: "auto",
        maxWidth: "none",
      },
    };
  }

  let chosen = placement;
  if (placement === "auto") {
    const spaceBelow = vh - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const spaceRight = vw - (rect.left + rect.width);
    const spaceLeft = rect.left;
    if (spaceBelow >= panelH + 16) chosen = "bottom";
    else if (spaceAbove >= panelH + 16) chosen = "top";
    else if (spaceRight >= panelW + 16) chosen = "right";
    else if (spaceLeft >= panelW + 16) chosen = "left";
    else chosen = "bottom";
  }

  if (compactSheet) {
    return {
      placement: chosen === "top" ? "top" : "bottom",
      compactSheet: true,
      style: {
        position: "fixed",
        left: margin,
        right: margin,
        bottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`,
        top: "auto",
        width: "auto",
        maxWidth: "none",
      },
    };
  }

  const gap = 16;
  let top = rect.top + rect.height + gap;
  let left = rect.left;
  switch (chosen) {
    case "top":
      top = rect.top - gap - panelH;
      left = rect.left + rect.width > vw * 0.66 ? rect.left + rect.width - panelW : rect.left;
      break;
    case "left":
      top = rect.top;
      left = rect.left - gap - panelW;
      break;
    case "right":
      top = rect.top;
      left = rect.left + rect.width + gap;
      break;
    case "bottom":
    default:
      top = rect.top + rect.height + gap;
      left = rect.left + rect.width > vw * 0.66 ? rect.left + rect.width - panelW : rect.left;
      chosen = "bottom";
      break;
  }

  left = Math.max(margin, Math.min(left, vw - panelW - margin));
  top = Math.max(margin, Math.min(top, vh - panelH - margin - footerReserve));

  return {
    placement: chosen,
    compactSheet: false,
    style: {
      position: "fixed",
      top,
      left,
      maxWidth: "min(28rem, calc(100vw - 1.5rem))",
      width: "min(28rem, calc(100vw - 1.5rem))",
    },
  };
}

/** @deprecated Use calloutLayout — kept so existing imports type-check. */
export function calloutStyle(
  rect: SpotlightRect | null,
  placement: GuidancePlacement = "auto",
): CSSProperties {
  return calloutLayout(rect, placement).style;
}
