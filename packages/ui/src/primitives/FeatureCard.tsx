import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type FeatureCardProps = {
  title: string;
  description: string;
  icon?: ReactNode | undefined;
  href?: string | undefined;
  className?: string | undefined;
  /** Optional trailing CTA label (e.g. “Explore service”). */
  ctaLabel?: string | undefined;
};

/** Marketing feature / service tile - link when `href` is set. */
export function FeatureCard({
  title,
  description,
  icon,
  href,
  className,
  ctaLabel,
}: FeatureCardProps) {
  const body = (
    <>
      {icon ? <div className="hamd-feature-card__icon">{icon}</div> : null}
      <h3 className="hamd-feature-card__title hamd-services__card-title">{title}</h3>
      <p className="hamd-feature-card__description hamd-services__card-body">
        {description}
      </p>
      {ctaLabel ? (
        <span className="hamd-feature-card__cta hamd-services__card-cta">{ctaLabel}</span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        className={cx("hamd-feature-card", "hamd-feature-card--link", className)}
        href={href}
      >
        {body}
      </a>
    );
  }

  return <article className={cx("hamd-feature-card", className)}>{body}</article>;
}

export type ServiceCardProps = FeatureCardProps;

/** Alias for service marketing tiles (same surface as FeatureCard). */
export function ServiceCard(props: ServiceCardProps) {
  return <FeatureCard {...props} />;
}
