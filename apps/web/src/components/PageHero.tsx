import type { ReactNode } from "react";
import { Container, SectionTitle } from "@hamd/ui/primitives";
import { cx } from "./cx.js";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb.js";

export type PageHeroProps = {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  actions?: ReactNode;
  breadcrumbs?: readonly BreadcrumbItem[] | undefined;
  className?: string | undefined;
};

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeroProps) {
  return (
    <section className={cx("hamd-page-hero", className)}>
      <Container>
        {breadcrumbs ? <Breadcrumb items={breadcrumbs} /> : null}
        <SectionTitle
          eyebrow={eyebrow}
          title={title}
          {...(description ? { description } : {})}
          actions={actions}
        />
      </Container>
    </section>
  );
}
