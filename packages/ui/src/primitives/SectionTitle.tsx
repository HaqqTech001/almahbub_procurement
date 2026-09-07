import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type SectionTitleProps = {
  id?: string | undefined;
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  align?: "start" | "center" | undefined;
  className?: string | undefined;
  actions?: ReactNode | undefined;
};

/**
 * Shared section heading - uses the same `.hamd-section__*` classes as `Section`
 * so typography stays one system.
 */
export function SectionTitle({
  id,
  eyebrow,
  title,
  description,
  align = "start",
  className,
  actions,
}: SectionTitleProps) {
  return (
    <header
      className={cx(
        "hamd-section__header",
        "hamd-section-title",
        `hamd-section-title--${align}`,
        className,
      )}
    >
      {eyebrow ? <p className="hamd-section__eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="hamd-section__title">
        {title}
      </h2>
      {description ? (
        <p className="hamd-section__description">{description}</p>
      ) : null}
      {actions ? <div className="hamd-section__actions">{actions}</div> : null}
    </header>
  );
}
