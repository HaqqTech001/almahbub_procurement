import { Link } from "react-router-dom";

import type { IeCommodityPreview } from "./commodities/index.js";
import { IE_PATHS } from "./ie-paths.js";
import { IeCommodityImage } from "./IeCommodityImage.js";
import { IeCommodityMediaPlaceholder } from "./IeCommodityMediaPlaceholder.js";

type IeCommodityCardProps = {
  commodity: IeCommodityPreview;
  headingLevel?: 2 | 3;
  detailHref?: string;
  quoteHref?: string;
};

export function IeCommodityCard({
  commodity,
  headingLevel = 2,
  detailHref,
  quoteHref,
}: IeCommodityCardProps) {
  const href = detailHref ?? IE_PATHS.commodity(commodity.slug);
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const imageAlt =
    commodity.imageAlt?.trim() ||
    `${commodity.name}: representative commodity image`;

  return (
    <article className="hamd-aie-commodity-card">
      <Link className="hamd-aie-commodity-card__media-link" to={href}>
        {commodity.imageSrc ? (
          <IeCommodityImage
            className="hamd-aie-commodity-card__image"
            src={commodity.imageSrc}
            alt={imageAlt}
            hero
          />
        ) : (
          <IeCommodityMediaPlaceholder
            className="hamd-aie-commodity-card__image"
            decorative
          />
        )}
      </Link>
      <div className="hamd-aie-commodity-card__body">
        <Heading className="hamd-aie-commodity-card__title">
          <Link to={href}>{commodity.name}</Link>
        </Heading>
        {commodity.category ? (
          <p className="hamd-aie-commodity-card__category">{commodity.category}</p>
        ) : null}
        {commodity.shortDescription ? (
          <p className="hamd-aie-commodity-card__copy">{commodity.shortDescription}</p>
        ) : null}
        <div className="hamd-aie-commodity-card__actions">
          {quoteHref ? (
            <>
              <Link className="hamd-btn hamd-btn--secondary" to={href}>
                View Commodity
                <span className="hamd-sr-only">: {commodity.name}</span>
              </Link>
              <Link className="hamd-btn hamd-btn--primary" to={quoteHref}>
                Request a Quote
              </Link>
            </>
          ) : (
            <Link className="hamd-aie-commodity-card__cta" to={href}>
              View Commodity
              <span className="hamd-sr-only">: {commodity.name}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
