import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/** Native button using the shared `.hamd-btn` system. */
export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("hamd-btn", `hamd-btn--${variant}`, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
