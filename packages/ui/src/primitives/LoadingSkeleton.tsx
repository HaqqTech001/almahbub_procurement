import { cx } from "../utils/cx.js";

export type LoadingSkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  radius?: "sm" | "md" | "lg" | "pill";
  "aria-label"?: string;
};

/** Static skeleton placeholder - no layout shift when sized explicitly. */
export function LoadingSkeleton({
  className,
  width = "100%",
  height = "1rem",
  radius = "md",
  "aria-label": ariaLabel,
}: LoadingSkeletonProps) {
  const labelled = Boolean(ariaLabel);
  return (
    <span
      className={cx(
        "hamd-skeleton",
        `hamd-skeleton--${radius}`,
        className,
      )}
      style={{ width, height }}
      aria-hidden={labelled ? undefined : true}
      role={labelled ? "status" : undefined}
      aria-label={ariaLabel}
      aria-busy={labelled ? true : undefined}
    />
  );
}
