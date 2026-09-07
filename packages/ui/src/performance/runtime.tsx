import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type UseIdleCallbackOptions = {
  timeoutMs?: number;
  disabled?: boolean;
};

/**
 * Schedule work during idle time with cancel on unmount (memory-safe).
 */
export function useIdleCallback(
  callback: () => void,
  { timeoutMs = 2500, disabled = false }: UseIdleCallbackOptions = {},
): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const run = () => cbRef.current();

    const ric = (
      window as Window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;

    if (typeof ric === "function") {
      idleId = ric(run, { timeout: timeoutMs });
    } else {
      timeoutId = setTimeout(run, Math.min(1200, timeoutMs));
    }

    return () => {
      if (idleId !== undefined) {
        (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback?.(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [disabled, timeoutMs]);
}

export type DeferredMountProps = {
  children: ReactNode;
  rootMargin?: string;
  eager?: boolean;
  fallback?: ReactNode;
  className?: string;
  /** Called once when mount is armed - use for chunk prefetch. */
  onArm?: () => void;
};

/**
 * Mount children near viewport; disconnects observer after first hit.
 * Reduces main-thread work and retained listeners (memory).
 */
export function DeferredMount({
  children,
  rootMargin = "320px 0px",
  eager = false,
  fallback = null,
  className,
  onArm,
}: DeferredMountProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(eager);
  const armed = useRef(false);

  useEffect(() => {
    if (ready) return;

    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready, rootMargin]);

  useEffect(() => {
    if (!ready || armed.current) return;
    armed.current = true;
    onArm?.();
  }, [ready, onArm]);

  return (
    <div className={className} data-deferred-mount={ready ? "ready" : "pending"}>
      <div
        ref={sentinelRef}
        className="hamd-perf-sentinel"
        aria-hidden="true"
      />
      {ready ? children : fallback}
    </div>
  );
}
