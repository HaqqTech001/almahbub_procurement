import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { Container, type ContentWidth } from "./Container.js";
import { SectionTitle } from "./SectionTitle.js";

export type SectionTone = "default" | "subtle" | "inverse" | "cta";
export type SectionSpacing = "compact" | "default" | "spacious";

export type SectionProps = {
  id?: string | undefined;
  children: ReactNode;
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  tone?: SectionTone | undefined;
  spacing?: SectionSpacing | undefined;
  width?: ContentWidth | undefined;
  className?: string | undefined;
  headerClassName?: string | undefined;
  animate?: boolean | undefined;
  actions?: ReactNode | undefined;
};

export function Section({
  id,
  children,
  eyebrow,
  title,
  description,
  tone = "default",
  spacing = "default",
  width = "default",
  className,
  headerClassName,
  animate = true,
  actions,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cx(
        "hamd-section",
        `hamd-section--${tone}`,
        `hamd-section--${spacing}`,
        animate && "hamd-section--animate",
        className,
      )}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <Container width={width}>
        <SectionTitle
          id={id ? `${id}-title` : undefined}
          eyebrow={eyebrow}
          title={title}
          description={description}
          align={tone === "cta" ? "center" : "start"}
          className={headerClassName}
          actions={actions}
        />
        <div className="hamd-section__body">{children}</div>
      </Container>
    </section>
  );
}
