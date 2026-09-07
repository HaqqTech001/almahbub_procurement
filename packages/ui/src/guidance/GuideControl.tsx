import { useEffect, useId, useRef, useState } from "react";
import { cx } from "../utils/cx.js";
import { useOptionalGuidance } from "./guidance-context.js";
import { GUIDANCE_MODES, guidanceModeLabel, type GuidanceMode } from "./types.js";

export type GuideControlProps = {
  className?: string | undefined;
  /** Accessible name for the control (not concatenated with status). */
  label?: string | undefined;
};

/**
 * Compact product-tour / help control for navbar utility cluster.
 * Never shows raw developer labels like "TourOn".
 */
export function GuideControl({
  className,
  label = "Product tour",
}: GuideControlProps) {
  const guidance = useOptionalGuidance();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!guidance) return null;

  const {
    mode,
    setMode,
    restartCurrentTour,
    restartAllTours,
    openHelpCenter,
    activeTour,
    paused,
    pauseTour,
    resumeTour,
  } = guidance;

  const status =
    mode === "off"
      ? "off"
      : paused
        ? "paused"
        : mode === "training"
          ? "training"
          : "on";
  const ariaLabel = `${label}, ${status === "off" ? "disabled" : status}`;

  return (
    <div className={cx("hamd-guide-control", className)} ref={rootRef}>
      <button
        type="button"
        className={cx(
          "hamd-guide-control__trigger",
          mode !== "off" && "is-active",
          activeTour && "is-running",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel}
        title={ariaLabel}
        data-guide="guide-control"
        onClick={() => setOpen((v) => !v)}
      >
        <HelpTourIcon />
        <span className="hamd-sr-only">{ariaLabel}</span>
        {mode !== "off" ? (
          <span className="hamd-guide-control__dot" aria-hidden="true" />
        ) : null}
      </button>
      {open ? (
        <div
          id={menuId}
          className="hamd-guide-control__menu"
          role="menu"
          aria-label="Product tour options"
        >
          <p className="hamd-guide-control__heading">Product tour</p>
          {GUIDANCE_MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="menuitemradio"
              aria-checked={mode === m}
              className={cx(
                "hamd-guide-control__item",
                mode === m && "is-active",
              )}
              onClick={() => {
                setMode(m as GuidanceMode);
                setOpen(false);
              }}
            >
              {m === "off" ? "Disable tours" : guidanceModeLabel(m)}
            </button>
          ))}
          <hr className="hamd-guide-control__rule" />
          {activeTour ? (
            <button
              type="button"
              role="menuitem"
              className="hamd-guide-control__item"
              onClick={() => {
                if (paused) resumeTour();
                else pauseTour();
                setOpen(false);
              }}
            >
              {paused ? "Resume tour" : "Pause tour"}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="hamd-guide-control__item"
            onClick={() => {
              restartCurrentTour();
              setOpen(false);
            }}
          >
            Restart this tour
          </button>
          <button
            type="button"
            role="menuitem"
            className="hamd-guide-control__item"
            onClick={() => {
              restartAllTours();
              setOpen(false);
            }}
          >
            Restart all tours
          </button>
          <button
            type="button"
            role="menuitem"
            className="hamd-guide-control__item"
            onClick={() => {
              openHelpCenter();
              setOpen(false);
            }}
          >
            Help center
          </button>
        </div>
      ) : null}
    </div>
  );
}

function HelpTourIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}
