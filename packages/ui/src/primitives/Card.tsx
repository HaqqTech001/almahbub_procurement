import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type CardProps = {
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

/** Generic surface card for interactive or content groupings. */
export function Card({ children, className, ...rest }: CardProps) {
  return (
    <article className={cx("hamd-card", className)} {...rest}>
      {children}
    </article>
  );
}
