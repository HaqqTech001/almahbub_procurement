import { useParams } from "react-router-dom";

import { Container } from "../../components/index.js";
import { usePublishedIeCommodity } from "../commodities/use-published-ie-catalogue.js";
import { IeEmptyState } from "../IeEmptyState.js";
import { IE_PATHS } from "../ie-paths.js";
import { IeCommodityDetailView } from "./IeCommodityDetailView.js";



/**
 * Commodity detail - published records only from the authoritative IE source.
 * Unknown or unpublished slugs stay intentional empty states (no invented specs).
 */
export function IeCommodityDetailPage() {
  const { slug = "" } = useParams();
  const safeSlug = slug.trim();
  const { commodity, source, loading, error } = usePublishedIeCommodity(safeSlug);
  if (loading) return <Container><p role="status">Loading commodity details...</p></Container>;

  if (!commodity) {
    return (
      <IeEmptyState
        title={
          error ? "Commodity details could not be loaded" : safeSlug
            ? "Commodity information is being updated"
            : "Commodity not available"
        }
        description={
          error ? "Please try again shortly, or contact our export team about your requirement." : safeSlug
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
