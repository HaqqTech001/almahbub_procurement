import { useParams } from "react-router-dom";

import { Container } from "../../components/index.js";
import { usePublishedIeCommodity } from "../commodities/use-published-ie-catalogue.js";
import { IeEmptyState } from "../IeEmptyState.js";
import { IE_PATHS } from "../ie-paths.js";
import { IeCommodityDetailView } from "./IeCommodityDetailView.js";
import { CANONICAL_PRESENTATION } from "../../content/canonical-presentation.js";
import { IeCommodityImage } from "../IeCommodityImage.js";

/**
 * Commodity detail - published records only from the authoritative IE source.
 * Unknown or unpublished slugs stay intentional empty states (no invented specs).
 */
export function IeCommodityDetailPage() {
  const { slug = "" } = useParams();
  const safeSlug = slug.trim();
  const { commodity, source, loading } = usePublishedIeCommodity(safeSlug);
  const artwork = CANONICAL_PRESENTATION.find(item => item.business === "IE" && item.slug === safeSlug.toLowerCase());

  // Present known artwork while fetching publication/commercial details; never invent a record.
  if (loading && artwork) return <article className="hamd-aie-commodity-detail" aria-labelledby="aie-commodity-loading-title">
    <Container>
      <header className="hamd-aie-commodity-detail__hero-block">
        <div className="hamd-aie-commodity-detail__hero-copy">
          <h1 id="aie-commodity-loading-title" className="hamd-aie-commodity-detail__title">{artwork.name}</h1>
          <p role="status">Loading commodity details…</p>
        </div>
        <div className="hamd-aie-commodity-detail__hero-media">
          <IeCommodityImage className="hamd-aie-commodity-detail__hero" slug={artwork.slug} src={artwork.src} alt={artwork.alt} loading="eager" hero />
        </div>
      </header>
    </Container>
  </article>;

  if (!commodity) {
    return (
      <IeEmptyState
        title={
          safeSlug
            ? "Commodity information is being updated"
            : "Commodity not available"
        }
        description={
          safeSlug
            ? `Detailed information for “${safeSlug}” is not published on this portal yet. Contact our export desk to discuss your requirement. We do not invent specifications, prices, or stock levels.`
            : "Commodity information is being updated. Contact our export desk to discuss your requirement."
        }
        secondaryHref={IE_PATHS.commodities}
        secondaryLabel="All Commodities"
      />
    );
  }

  return (
    <article
      className="hamd-aie-commodity-detail"
      aria-labelledby="aie-commodity-detail-title"
      data-ie-catalogue-source={source}
    >
      <Container>
        <IeCommodityDetailView commodity={commodity} />
      </Container>
    </article>
  );
}
