import { ButtonLink, Container } from "../../components/index.js";
import { INTEGRATED_EXPORT_PORTAL } from "../../content/group.js";
import {
  IE_PROCESS_MEDIA,
  REPRESENTATIVE_MEDIA_CAPTION,
} from "../../content/media-assets.js";
import { IE_CTA, IE_PATHS } from "../ie-paths.js";
import { listPublishedIeMarkets } from "../markets/index.js";

/**
 * IE-6 Global Markets - content-safe / data-ready.
 * No invented countries, continents-as-coverage, volumes, flags, or client logos.
 */
export function IeMarketsPage() {
  const portal = INTEGRATED_EXPORT_PORTAL;
  const page = portal.marketsPage;
  const hero = IE_PROCESS_MEDIA.heroPort;
  const publishedMarkets = listPublishedIeMarkets();

  return (
    <div className="hamd-aie-markets">
      <section className="hamd-aie-markets__hero" aria-labelledby="aie-markets-hero-title">
        <Container>
          <div className="hamd-aie-markets__hero-grid">
            <div className="hamd-aie-markets__hero-copy">
              <p className="hamd-aie-markets__eyebrow">Global Markets</p>
              <h1 id="aie-markets-hero-title" className="hamd-aie-markets__title">
                {page.heroTitle}
              </h1>
              <p className="hamd-aie-markets__lead">{page.heroLead}</p>
              <div className="hamd-aie-markets__actions">
                <ButtonLink
                  href={IE_CTA.href}
                  variant="primary"
                  className="hamd-aie-portal__cta"
                >
                  {IE_CTA.label}
                </ButtonLink>
                <ButtonLink href={IE_PATHS.quality} variant="secondary">
                  {page.qualityLinkLabel}
                </ButtonLink>
              </div>
            </div>
            <div className="hamd-aie-markets__hero-visual-wrap">
              <div
                className="hamd-aie-markets__globe"
                aria-hidden="true"
                role="presentation"
              >
                <span className="hamd-aie-markets__globe-ring" />
                <span className="hamd-aie-markets__globe-ring hamd-aie-markets__globe-ring--mid" />
                <span className="hamd-aie-markets__globe-meridian" />
                <span className="hamd-aie-markets__globe-parallel" />
                <span className="hamd-aie-markets__globe-core" />
              </div>
              <p className="hamd-aie-markets__globe-caption">
                Conceptual global orientation - not a map of markets served.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-markets__section"
        aria-labelledby="aie-markets-reach-title"
      >
        <Container>
          <div className="hamd-aie-markets__split">
            <div>
              <h2 id="aie-markets-reach-title" className="hamd-aie-markets__section-title">
                {page.reachTitle}
              </h2>
              {page.reach.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="hamd-aie-markets__copy">
                  {paragraph}
                </p>
              ))}
            </div>
            <figure className="hamd-aie-markets__split-media">
              <img
                src={hero.src}
                alt={hero.alt}
                width={1400}
                height={875}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="hamd-aie-markets__media-caption">
                {REPRESENTATIVE_MEDIA_CAPTION}
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-markets__section hamd-aie-markets__section--subtle"
        aria-labelledby="aie-markets-coord-title"
      >
        <Container>
          <header className="hamd-aie-markets__section-head">
            <h2 id="aie-markets-coord-title" className="hamd-aie-markets__section-title">
              {page.coordinationTitle}
            </h2>
            <p className="hamd-aie-markets__copy">{page.coordinationLead}</p>
          </header>
          <ul className="hamd-aie-markets__topic-list">
            {page.coordinationThemes.map((theme) => (
              <li key={theme}>{theme}</li>
            ))}
          </ul>
          <div className="hamd-aie-markets__actions">
            <ButtonLink href={IE_PATHS.quality} variant="secondary">
              {page.qualityLinkLabel}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-markets__section"
        aria-labelledby="aie-markets-dest-title"
      >
        <Container>
          <header className="hamd-aie-markets__section-head">
            <h2 id="aie-markets-dest-title" className="hamd-aie-markets__section-title">
              {page.destinationTitle}
            </h2>
            <p className="hamd-aie-markets__copy">{page.destinationLead}</p>
          </header>
          <ol className="hamd-aie-markets__flow" aria-label="Destination requirement flow">
            {page.destinationSteps.map((step, index) => (
              <li key={step.title} className="hamd-aie-markets__flow-card">
                <span className="hamd-aie-markets__flow-num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="hamd-aie-markets__flow-title">{step.title}</h3>
                <p className="hamd-aie-markets__flow-copy">{step.description}</p>
              </li>
            ))}
          </ol>
          <p className="hamd-aie-markets__flow-legend" aria-hidden="true">
            Destination → Requirements → Specification → Documentation → Preparation
          </p>
        </Container>
      </section>

      <section
        className="hamd-aie-markets__section hamd-aie-markets__section--subtle"
        aria-labelledby="aie-markets-data-title"
      >
        <Container width="narrow">
          <h2 id="aie-markets-data-title" className="hamd-aie-markets__section-title">
            {page.dataTitle}
          </h2>
          {publishedMarkets.length > 0 ? (
            <ul className="hamd-aie-markets__market-list">
              {publishedMarkets.map((market) => (
                <li key={market.id} className="hamd-aie-markets__market-card">
                  <h3 className="hamd-aie-markets__market-name">{market.name}</h3>
                  {market.region ? (
                    <p className="hamd-aie-markets__market-meta">{market.region}</p>
                  ) : null}
                  {market.description ? (
                    <p className="hamd-aie-markets__copy">{market.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="hamd-aie-markets__empty-panel" role="status">
              <h3 className="hamd-aie-markets__empty-title">{page.dataEmptyTitle}</h3>
              <p className="hamd-aie-markets__copy">{page.dataEmptyBody}</p>
              <div className="hamd-aie-markets__actions">
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
          )}
        </Container>
      </section>

      <section
        className="hamd-aie-markets__section"
        aria-labelledby="aie-markets-process-title"
      >
        <Container width="narrow">
          <h2 id="aie-markets-process-title" className="hamd-aie-markets__section-title">
            {page.processTitle}
          </h2>
          <p className="hamd-aie-markets__copy">{page.processBody}</p>
          <p className="hamd-aie-markets__flow-legend hamd-aie-markets__flow-legend--text">
            {page.processFlowLegend}
          </p>
          <div className="hamd-aie-markets__actions">
            <ButtonLink href={IE_PATHS.process} variant="secondary">
              {page.processLinkLabel}
            </ButtonLink>
            <ButtonLink href={IE_PATHS.quality} variant="secondary">
              Destination requirements
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-markets__section hamd-aie-markets__section--cta"
        aria-labelledby="aie-markets-cta-title"
      >
        <Container width="narrow">
          <h2 id="aie-markets-cta-title" className="hamd-aie-markets__section-title">
            {portal.home.finalCta.title}
          </h2>
          <p className="hamd-aie-markets__copy">{portal.home.finalCta.description}</p>
          <div className="hamd-aie-markets__actions">
            <ButtonLink
              href={IE_CTA.href}
              variant="primary"
              className="hamd-aie-portal__cta"
            >
              {IE_CTA.label}
            </ButtonLink>
            <ButtonLink href={IE_PATHS.commodities} variant="secondary">
              Explore Commodities
            </ButtonLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
