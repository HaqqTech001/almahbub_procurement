import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cx } from "../utils/cx.js";

export type VirtualizedListProps<T> = {
  items: T[];
  itemHeight: number;
  height: number;
  overscan?: number;
  className?: string;
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
  "aria-label"?: string;
};

/**
 * Lightweight windowed list - no extra dependency.
 * Principles: GitHub-density lists, Stripe calm empty states.
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  overscan = 4,
  className,
  getKey,
  renderItem,
  empty,
  "aria-label": ariaLabel = "List",
}: VirtualizedListProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const { start, end, offsetY, totalHeight } = useMemo(() => {
    const total = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length, startIndex + visibleCount);
    return {
      start: startIndex,
      end: endIndex,
      offsetY: startIndex * itemHeight,
      totalHeight: total,
    };
  }, [height, itemHeight, items.length, overscan, scrollTop]);

  if (items.length === 0) {
    return (
      <div className={cx("hamd-dash-empty", className)} role="status">
        {empty ?? "Nothing here yet."}
      </div>
    );
  }

  const slice = items.slice(start, end);

  return (
    <div
      ref={scrollerRef}
      className={cx("hamd-dash-virtual", className)}
      style={{ height } satisfies CSSProperties}
      role="list"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div className="hamd-dash-virtual__spacer" style={{ height: totalHeight }}>
        <div
          className="hamd-dash-virtual__window"
          style={{ transform: `translate3d(0, ${offsetY}px, 0)` }}
        >
          {slice.map((item, i) => {
            const index = start + i;
            return (
              <div
                key={getKey(item, index)}
                className="hamd-dash-virtual__row"
                role="listitem"
                style={{ height: itemHeight }}
              >
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
