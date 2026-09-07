import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type DetailSectionProps = {
  title: string;
  children: ReactNode;
  className?: string | undefined;
};

export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <section className={cx("hamd-detail-section", className)}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
