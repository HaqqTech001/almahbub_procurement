import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "celebration";

export type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string | undefined;
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span className={cx("hamd-badge", `hamd-badge--${tone}`, className)}>
      {children}
    </span>
  );
}
