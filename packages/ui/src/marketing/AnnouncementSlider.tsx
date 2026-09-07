import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cx } from "../utils/cx.js";
import { CelebrationEffects } from "./CelebrationEffects.js";

/**
 * Reusable announcement slide contract - ready for CMS/API mapping later.
 * Presentational only; hosts filter active slides before passing them in.
 */
export type AnnouncementSlide = {
  id: string;
  /** Short hierarchy label (e.g. “Celebrating with our family”). */
  title: string;
  message: string;
  category?: string;
  priority?: number;
  publishedAt?: string;
  expiresAt?: string;
  dismissible: boolean;
  mediaSrc?: string;
  mediaAlt?: string;
  ctaLabel?: string;
  href?: string;
  /** Visual treatment for the slide surface. */
  theme?: "default" | "celebration" | "alert";
  showConfetti?: boolean;
  /** Compact celebration accent for rhythm / Rowdotul HAMD'26 emphasis. */
  accent?: "sparkle" | "glow" | "sprinkle" | "hamd";
};

export type AnnouncementSliderProps = {
  announcements: readonly AnnouncementSlide[];
  className?: string;
  storagePrefix?: string;
  allowRestore?: boolean;
  /** Auto-advance interval in ms. Disabled when ≤1 visible slide or reduced motion. */
  autoRotateMs?: number;
  /**
   * `minimal` hides arrows/dots for the compact global celebration strip.
   * Auto-rotate and swipe still work.
   */
  chrome?: "full" | "minimal";
};

const DEFAULT_STORAGE_PREFIX = "hamd.campaign.dismissed.";
const DEFAULT_AUTO_MS = 1500;

function isDismissed(prefix: string, id: string): boolean {
  try {
    return window.localStorage.getItem(`${prefix}${id}`) === "1";
  } catch {
    return false;
  }
}

function persistDismiss(prefix: string, id: string): void {
  try {
    window.localStorage.setItem(`${prefix}${id}`, "1");
  } catch {
    /* ignore */
  }
}

function clearDismiss(prefix: string, id: string): void {
  try {
    window.localStorage.removeItem(`${prefix}${id}`);
  } catch {
    /* ignore */
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Site announcement slider - multi-slide carousel above the public navbar.
 * Single-slide mode hides carousel chrome. Wedding (or any celebration) is
 * one data item, not a hard-coded banner.
 */
export function AnnouncementSlider({
  announcements,
  className,
  storagePrefix = DEFAULT_STORAGE_PREFIX,
  allowRestore = true,
  autoRotateMs = DEFAULT_AUTO_MS,
  chrome = "full",
}: AnnouncementSliderProps) {
  const labelId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const goRef = useRef<(delta: number) => void>(() => undefined);
  const pausedRef = useRef(false);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const next = new Set<string>();
    for (const item of announcements) {
      if (isDismissed(storagePrefix, item.id)) next.add(item.id);
    }
    setDismissedIds(next);
    setHydrated(true);
  }, [announcements, storagePrefix]);

  const visible = announcements.filter((item) => !dismissedIds.has(item.id));
  const allDismissed =
    hydrated &&
    announcements.length > 0 &&
    visible.length === 0 &&
    announcements.some((item) => item.dismissible);

  useEffect(() => {
    setIndex((current) => {
      if (visible.length === 0) return 0;
      return Math.min(current, visible.length - 1);
    });
  }, [visible.length]);

  const go = useCallback(
    (delta: number) => {
      if (visible.length <= 1) return;
      setIndex((current) => (current + delta + visible.length) % visible.length);
      setCycleKey((value) => value + 1);
    },
    [visible.length],
  );
  goRef.current = go;
  pausedRef.current = paused;

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= visible.length) return;
      setIndex(next);
    },
    [visible.length],
  );

  useEffect(() => {
    if (!hydrated || visible.length <= 1 || autoRotateMs <= 0) return;
    const timer = window.setInterval(() => {
      if (pausedRef.current) return;
      goRef.current(1);
    }, autoRotateMs);
    return () => window.clearInterval(timer);
  }, [autoRotateMs, cycleKey, hydrated, visible.length]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (visible.length <= 1) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(visible.length - 1);
    }
  };

  const onPointerDown = (event: ReactPointerEvent) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: ReactPointerEvent) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || visible.length <= 1) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  };

  if (!announcements.length) return null;

  if (allDismissed && allowRestore) {
    const first = announcements[0]!;
    return (
      <aside
        className={cx(
          "hamd-announcement-slider",
          "hamd-announcement-slider--compact",
          className,
        )}
        role="region"
        aria-label="Site announcements"
      >
        <div className="hamd-announcement-slider__inner hamd-announcement-slider__inner--compact">
          <p className="hamd-announcement-slider__restore-copy">
            <span className="hamd-announcement-slider__eyebrow">{first.title}</span>
            <span aria-hidden="true"> · </span>
            <span>Announcements hidden</span>
          </p>
          <button
            type="button"
            className="hamd-announcement-slider__restore"
            onClick={() => {
              for (const item of announcements) {
                clearDismiss(storagePrefix, item.id);
              }
              setDismissedIds(new Set());
              setIndex(0);
            }}
          >
            Show again
          </button>
        </div>
      </aside>
    );
  }

  if (!visible.length) return null;

  const current = visible[index] ?? visible[0]!;
  const multi = visible.length > 1;
  const theme = current.theme ?? (current.showConfetti ? "celebration" : "default");
  const accent = current.accent;
  const isHamd =
    accent === "hamd" ||
    current.title.includes("Rowdotul HAMD'26") ||
    current.message.includes("Rowdotul HAMD'26");
  const showDecor =
    Boolean(current.showConfetti) ||
    theme === "celebration" ||
    accent === "sparkle" ||
    accent === "glow" ||
    accent === "sprinkle" ||
    accent === "hamd" ||
    isHamd;
  const showChrome = chrome === "full" && multi;

  const dismissCurrent = () => {
    if (!current.dismissible) return;
    persistDismiss(storagePrefix, current.id);
    setDismissedIds((prev) => new Set(prev).add(current.id));
  };

  return (
    <aside
      ref={rootRef}
      className={cx(
        "hamd-announcement-slider",
        "hamd-announcement-slider--strip",
        `hamd-announcement-slider--${theme}`,
        isHamd && "hamd-announcement-slider--hamd",
        accent && `hamd-announcement-slider--accent-${accent}`,
        reducedMotion && "hamd-announcement-slider--reduced",
        className,
      )}
      role="region"
      aria-roledescription={multi ? "carousel" : undefined}
      aria-labelledby={labelId}
      data-announcement-id={current.id}
      data-accent={accent ?? (isHamd ? "hamd" : undefined)}
      tabIndex={multi ? 0 : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <span id={labelId} className="hamd-announcement-slider__sr-only">
        Site announcements
      </span>

      {showDecor ? (
        <CelebrationEffects
          className="hamd-announcement-slider__effects"
          intensity={isHamd ? "hamd" : accent === "sparkle" || accent === "sprinkle" ? "rich" : "default"}
          pulseKey={current.id}
        />
      ) : null}

      <div className="hamd-announcement-slider__inner">
        <div
          key={current.id}
          className="hamd-announcement-slider__slide"
          aria-live="polite"
        >
          {current.mediaSrc ? (
            <img
              className="hamd-announcement-slider__media"
              src={current.mediaSrc}
              alt={current.mediaAlt ?? ""}
              width={56}
              height={56}
              decoding="async"
            />
          ) : null}
          <div className="hamd-announcement-slider__copy">
            <p
              className={cx(
                "hamd-announcement-slider__eyebrow",
                isHamd && "hamd-announcement-slider__eyebrow--hamd",
              )}
            >
              {current.title}
            </p>
            {current.message.trim() ? (
              <p className="hamd-announcement-slider__message">
                {current.message}
              </p>
            ) : null}
            {current.href && current.ctaLabel ? (
              <div className="hamd-announcement-slider__actions">
                <a className="hamd-announcement-slider__cta" href={current.href}>
                  {current.ctaLabel}
                </a>
                {current.dismissible ? (
                  <button
                    type="button"
                    className="hamd-announcement-slider__dismiss"
                    onClick={dismissCurrent}
                  >
                    Dismiss
                  </button>
                ) : null}
              </div>
            ) : current.dismissible ? (
              <div className="hamd-announcement-slider__actions">
                <button
                  type="button"
                  className="hamd-announcement-slider__dismiss"
                  onClick={dismissCurrent}
                >
                  Dismiss
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {showChrome ? (
          <div
            className="hamd-announcement-slider__controls"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <button
              type="button"
              className="hamd-announcement-slider__nav"
              aria-label="Previous announcement"
              onClick={() => go(-1)}
            >
              <ChevronLeftIcon />
            </button>
            <div
              className="hamd-announcement-slider__dots"
              role="tablist"
              aria-label="Announcement slides"
            >
              {visible.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Announcement ${i + 1} of ${visible.length}`}
                  className={cx(
                    "hamd-announcement-slider__dot",
                    i === index && "is-active",
                  )}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className="hamd-announcement-slider__nav"
              aria-label="Next announcement"
              onClick={() => go(1)}
            >
              <ChevronRightIcon />
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
