import { Link } from "react-router-dom";

import { ButtonLink } from "../../components/index.js";
import { useIeQuoteHref } from "../use-ie-quote-href.js";
import { ALMAHBUB_INTEGRATED_EXPORT } from "../../content/group.js";
import { REPRESENTATIVE_MEDIA_CAPTION } from "../../content/media-assets.js";
import type { IeCommodity } from "../commodities/index.js";
import { IeCommodityImage } from "../IeCommodityImage.js";
import { IeCommodityMediaPlaceholder } from "../IeCommodityMediaPlaceholder.js";
import { IE_PATHS } from "../ie-paths.js";

type IeCommodityDetailViewProps = {
  commodity: IeCommodity;
};

/**
 * Renders only fields present on an approved published commodity.
 * Missing optional media/specs/markets are omitted or use IE placeholders - never invented.
 */
export function IeCommodityDetailView({ commodity }: IeCommodityDetailViewProps) {
  const quoteHref = useIeQuoteHref(commodity.slug);

  return (
    <div className="hamd-aie-commodity-detail__layout">
      <nav className="hamd-aie-commodity-detail__crumb" aria-label="Breadcrumb">
        <Link to={IE_PATHS.commodities}>Commodities</Link>
        <span aria-hidden="true"> / </span>
        <span>{commodity.name}</span>
      </nav>

      <header className="hamd-aie-commodity-detail__hero-block">
        <div className="hamd-aie-commodity-detail__hero-copy">
          {commodity.category ? (
            <p className="hamd-aie-commodity-detail__meta">{commodity.category}</p>
          ) : null}
          <h1 id="aie-commodity-detail-title" className="hamd-aie-commodity-detail__title">
            {commodity.name}
          </h1>
          {commodity.shortDescription ? (
            <p className="hamd-aie-commodity-detail__lead">{commodity.shortDescription}</p>
          ) : null}
        </div>
        <div className="hamd-aie-commodity-detail__hero-media">
          {commodity.heroMedia ? (
            <figure className="hamd-aie-commodity-detail__hero-figure">
              <IeCommodityImage
                slug={commodity.slug}
                className="hamd-aie-commodity-detail__hero"
                src={commodity.heroMedia.src}
                alt={commodity.heroMedia.alt}
                loading="eager"
                hero
              />
              <figcaption className="hamd-aie-commodity-detail__media-caption">
                {REPRESENTATIVE_MEDIA_CAPTION}
              </figcaption>
            </figure>
          ) : (
            <IeCommodityMediaPlaceholder
              className="hamd-aie-commodity-detail__hero hamd-aie-commodity-detail__hero--placeholder"
              label={ALMAHBUB_INTEGRATED_EXPORT.mediaLabel}
            />
          )}
        </div>
      </header>

      {commodity.specifications && commodity.specifications.length > 0 ? (
        <section
          className="hamd-aie-commodity-detail__section"
          aria-labelledby="aie-commodity-specs"
        >
          <h2 id="aie-commodity-specs" className="hamd-aie-commodity-detail__h2">
            Specifications
          </h2>
          <dl className="hamd-aie-commodity-detail__specs">
            {commodity.specifications.map((row) => (
              <div key={`${row.label}:${row.value}`} className="hamd-aie-commodity-detail__spec">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {commodity.packaging ? (
        <section
          className="hamd-aie-commodity-detail__section"
          aria-labelledby="aie-commodity-packaging"
        >
          <h2 id="aie-commodity-packaging" className="hamd-aie-commodity-detail__h2">
            Packaging
          </h2>
          <p className="hamd-aie-commodity-detail__copy">{commodity.packaging}</p>
        </section>
      ) : null}

      {commodity.qualityInformation ? (
        <section
          className="hamd-aie-commodity-detail__section"
          aria-labelledby="aie-commodity-quality"
        >
          <h2 id="aie-commodity-quality" className="hamd-aie-commodity-detail__h2">
            Quality information
          </h2>
          <p className="hamd-aie-commodity-detail__copy">{commodity.qualityInformation}</p>
        </section>
      ) : null}

      {commodity.applications && commodity.applications.length > 0 ? (
        <section
          className="hamd-aie-commodity-detail__section"
          aria-labelledby="aie-commodity-apps"
        >
          <h2 id="aie-commodity-apps" className="hamd-aie-commodity-detail__h2">
            Applications
          </h2>
          <ul className="hamd-aie-commodity-detail__list">
            {commodity.applications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {commodity.markets ? (
        <section
          className="hamd-aie-commodity-detail__section"
          aria-labelledby="aie-commodity-markets"
        >
          <h2 id="aie-commodity-markets" className="hamd-aie-commodity-detail__h2">
            Markets
          </h2>
          <p className="hamd-aie-commodity-detail__copy">{commodity.markets}</p>
        </section>
      ) : null}

      {commodity.description && commodity.description !== commodity.shortDescription ? (
        <section
          className="hamd-aie-commodity-detail__section"
          aria-labelledby="aie-commodity-overview"
        >
          <h2 id="aie-commodity-overview" className="hamd-aie-commodity-detail__h2">
            Additional details
          </h2>
          <p className="hamd-aie-commodity-detail__copy">{commodity.description}</p>
        </section>
      ) : null}

      {commodity.gallery && commodity.gallery.length > 0 ? (
        <section
          className="hamd-aie-commodity-detail__section"
          aria-labelledby="aie-commodity-gallery"
        >
          <h2 id="aie-commodity-gallery" className="hamd-aie-commodity-detail__h2">
            Gallery
          </h2>
          <ul className="hamd-aie-commodity-detail__gallery">
            {commodity.gallery.map((asset) => (
              <li key={asset.src} className="hamd-aie-commodity-detail__gallery-item">
                <figure>
                  <div className="hamd-aie-commodity-detail__gallery-tile">
                    <IeCommodityImage src={asset.src} alt={asset.alt} />
                  </div>
                  <figcaption className="hamd-aie-commodity-detail__media-caption">
                    {REPRESENTATIVE_MEDIA_CAPTION}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        className="hamd-aie-commodity-detail__request"
        aria-labelledby="aie-commodity-request"
      >
        <h2 id="aie-commodity-request" className="hamd-aie-commodity-detail__h2">
          Request a Quote
        </h2>
        <p className="hamd-aie-commodity-detail__copy">
          Include quantity, grade and destination. Availability and commercial terms are confirmed in your quotation.
        </p>
        <div className="hamd-aie-commodity-detail__actions">
          <ButtonLink
            href={quoteHref}
            variant="primary"
            className="hamd-aie-portal__cta"
          >
            Request Export Supply
          </ButtonLink>
          <Link className="hamd-btn hamd-btn--secondary" to={IE_PATHS.commodities}>
            All Commodities
          </Link>
        </div>
      </section>
    </div>
  );
}
