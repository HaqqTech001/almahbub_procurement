import { Link } from "react-router-dom";
import { ButtonLink, Container } from "../components/index.js";
import { IE_CTA } from "./ie-paths.js";
import { useIeQuoteHref } from "./use-ie-quote-href.js";

type IeEmptyStateProps = {
  title: string;
  description: string;
  /** Optional secondary action (e.g. Contact). */
  secondaryHref?: string;
  secondaryLabel?: string;
};

/**
 * Intentional production-quality empty state - not a broken page.
 * Used until owner-approved commodity / process / market content exists.
 */
export function IeEmptyState({
  title,
  description,
  secondaryHref,
  secondaryLabel,
}: IeEmptyStateProps) {
  const quoteHref = useIeQuoteHref();
  return (
    <section className="hamd-aie-empty" aria-labelledby="aie-empty-title">
      <Container width="narrow">
        <h1 id="aie-empty-title" className="hamd-aie-empty__title">
          {title}
        </h1>
        <p className="hamd-aie-empty__copy">{description}</p>
        <div className="hamd-aie-empty__actions">
          <ButtonLink
            href={quoteHref}
            variant="primary"
            className="hamd-aie-portal__cta"
          >
            {IE_CTA.label}
          </ButtonLink>
          {secondaryHref && secondaryLabel ? (
            <Link className="hamd-btn hamd-btn--secondary" to={secondaryHref}>
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
