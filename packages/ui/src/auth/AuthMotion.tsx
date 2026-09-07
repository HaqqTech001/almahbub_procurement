import { type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";

export type AuthMotionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Skip entrance animation even when motion is allowed. */
  instant?: boolean;
};

/**
 * CSS entrance for auth panels - no framer-motion on the critical path.
 * Hosts that need Framer can wrap children themselves after lazy-loading it.
 */
export function AuthMotion({
  children,
  instant,
  className,
  ...rest
}: AuthMotionProps) {
  const reduced = usePrefersReducedMotion();
  const animate = !reduced && !instant;

  return (
    <div
      className={cx(animate && "hamd-auth-motion", className)}
      data-auth-motion={animate ? "enter" : "static"}
      {...rest}
    >
      {children}
    </div>
  );
}
