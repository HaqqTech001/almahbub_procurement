import { CANONICAL_PRESENTATION } from "../../content/canonical-presentation.js";
import { ButtonLink, Container } from "../../components/index.js";
import { INTEGRATED_EXPORT_PORTAL } from "../../content/group.js";
import { usePublishedIeCommodities } from "../commodities/use-published-ie-catalogue.js";
import { IeCommodityCard } from "../IeCommodityCard.js";
import { IE_CTA, IE_PATHS } from "../ie-paths.js";

/**
 * IE commodities catalogue - data-driven from published IE commodities.
 * Empty catalogue is the fallback when no published records exist.
 */
export function IeCommoditiesPage() {
  const portal = INTEGRATED_EXPORT_PORTAL;
  const home = portal.home;
  const { previews, source, loading, error, retry } = usePublishedIeCommodities();
  const isEmpty = !loading && !error && previews.length === 0;

  return (
    <div className="hamd-aie-catalogue">
      <section
        className="hamd-aie-catalogue__hero"
        aria-labelledby="aie-catalogue-title"
      >
        <Container>
          <p className="hamd-aie-catalogue__eyebrow">Integrated Export</p>
          <h1 id="aie-catalogue-title" className="hamd-aie-catalogue__title">
            {home.commoditiesPreview.title}
          </h1>
          <p className="hamd-aie-catalogue__lead">{portal.commodities.description}</p>
        </Container>
      </section>

      <section
        className="hamd-aie-catalogue__body"
        aria-labelledby={
          isEmpty ? "aie-catalogue-empty-title" : "aie-catalogue-list-title"
        }
      >
        <Container>
          {loading ? <>
            <h2 id="aie-catalogue-list-title" className="hamd-sr-only">Explore agricultural commodities</h2>
            <p role="status">Loading published commodity details…</p>
            <ul className="hamd-aie-catalogue__grid" aria-label="Commodity range">
              {CANONICAL_PRESENTATION.filter(item => item.business === "IE").map(item => <li key={item.slug}>
                <IeCommodityCard commodity={{ slug: item.slug, name: item.name, imageSrc: item.src, imageAlt: item.alt }} headingLevel={3} />
              </li>)}
            </ul>
          </> : error ? (
            <div className="hamd-aie-catalogue__empty" data-ie-catalogue-source={source}>
              <div className="hamd-aie-catalogue__empty-panel" role="alert">
                <h2 id="aie-catalogue-empty-title" className="hamd-aie-catalogue__empty-title">
                  We couldn't load commodities.
                </h2>
                <p className="hamd-aie-catalogue__empty-copy">
                  The published Integrated Export catalogue did not load.
                </p>
                <button type="button" className="hamd-btn hamd-btn--primary" onClick={retry}>
                  Try Again
                </button>
              </div>
            </div>
          ) : isEmpty ? (
            <div
              className="hamd-aie-catalogue__empty"
              data-ie-catalogue-source={source}
            >
              <div
                className="hamd-aie-catalogue__empty-panel"
                role="status"
              >
                <h2
                  id="aie-catalogue-empty-title"
                  className="hamd-aie-catalogue__empty-title"
                >
                  {home.commoditiesPreview.emptyTitle}
                </h2>
                <p className="hamd-aie-catalogue__empty-copy">
                  {home.commoditiesPreview.emptyDescription}
                </p>
                <div className="hamd-aie-catalogue__actions">
                  <ButtonLink
                    href={IE_CTA.href}
                    variant="primary"
                    className="hamd-aie-portal__cta"
                  >
                    {IE_CTA.label}
                  </ButtonLink>
                  <ButtonLink href={IE_PATHS.contact} variant="secondary">
                    Contact
                  </ButtonLink>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h2 id="aie-catalogue-list-title" className="hamd-sr-only">
                Published commodities
              </h2>
              <ul className="hamd-aie-catalogue__grid" data-ie-catalogue-source={source}>
                {previews.map((item) => (
                  <li key={item.slug}>
                    <IeCommodityCard commodity={item} headingLevel={3} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Container>
      </section>

      <section
        className="hamd-aie-catalogue__cta"
        aria-labelledby="aie-catalogue-cta-title"
      >
        <Container width="narrow">
          <h2 id="aie-catalogue-cta-title" className="hamd-aie-catalogue__cta-title">
            {portal.home.finalCta.title}
          </h2>
          <p className="hamd-aie-catalogue__cta-copy">
            {portal.home.finalCta.description}
          </p>
          <div className="hamd-aie-catalogue__actions">
            <ButtonLink
              href={IE_CTA.href}
              variant="primary"
              className="hamd-aie-portal__cta"
            >
              {IE_CTA.label}
            </ButtonLink>
            <ButtonLink href={IE_PATHS.home} variant="secondary">
              Back to Integrated Export
            </ButtonLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
