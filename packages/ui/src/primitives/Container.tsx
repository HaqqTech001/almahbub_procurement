import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ContentWidth = "narrow" | "default" | "wide" | "full";

const widthClass: Record<ContentWidth, string> = {
  narrow: "hamd-container--narrow",
  default: "hamd-container--default",
  wide: "hamd-container--wide",
  full: "hamd-container--full",
};

export type ContainerProps = {
  children: ReactNode;
  width?: ContentWidth;
  className?: string;
  as?: "div" | "section" | "article";
};

export function Container({
  children,
  width = "default",
  className,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag className={cx("hamd-container", widthClass[width], className)}>
      {children}
    </Tag>
  );
}
