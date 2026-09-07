import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type BackgroundPatternVariant = "dots" | "grid" | "mesh";

export type BackgroundPatternProps = {
  variant?: BackgroundPatternVariant;
  className?: string;
  children?: ReactNode;
};

/** Decorative atmosphere layer - sits behind content, pointer-events none. */
export function BackgroundPattern({
  variant = "dots",
  className,
  children,
}: BackgroundPatternProps) {
  return (
    <div
      className={cx(
        "hamd-bg-pattern",
        `hamd-bg-pattern--${variant}`,
        className,
      )}
      aria-hidden={children ? undefined : true}
    >
      {children}
    </div>
  );
}
