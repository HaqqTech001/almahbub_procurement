import { ButtonLink, Container } from "../../components/index.js";
import { INTEGRATED_EXPORT_PORTAL } from "../../content/group.js";
import {
  IE_PROCESS_MEDIA,
  REPRESENTATIVE_MEDIA_CAPTION,
} from "../../content/media-assets.js";
import { usePublishedIeCommodities } from "../commodities/use-published-ie-catalogue.js";
import { IE_CTA, IE_PATHS } from "../ie-paths.js";

/**
 * IE-5 Quality & Compliance - content-safe guidance only.
 * No invented certifications, laboratories, facilities, or country lists.
 */
export function IeQualityPage() {
  const portal = INTEGRATED_EXPORT_PORTAL;
  const page = portal.qualityPage;
  const hero = IE_PROCESS_MEDIA.qualityBeans;
  const { commodities } = usePublishedIeCommodities();
  const hasPublishedCommodities = commodities.length > 0;

  return (
    <div className="hamd-aie-quality">
      <section className="hamd-aie-quality__hero" aria-labelledby="aie-quality-hero-title">
        <Container>
          <div className="hamd-aie-quality__hero-grid">
            <div className="hamd-aie-quality__hero-copy">
              <p className="hamd-aie-quality__eyebrow">Quality &amp; Compliance</p>
              <h1 id="aie-quality-hero-title" className="hamd-aie-quality__title">
                {page.heroTitle}
              </h1>
              <p className="hamd-aie-quality__lead">{page.heroLead}</p>
              <div className="hamd-aie-quality__actions">
                <ButtonLink
                  href={IE_CTA.href}
                  variant="primary"
                  className="hamd-aie-portal__cta"
                >
                  {IE_CTA.label}
                </ButtonLink>
                <ButtonLink href={IE_PATHS.process} variant="secondary">
                  {page.processLinkLabel}
                </ButtonLink>
              </div>
            </div>
            <figure className="hamd-aie-quality__hero-media">
              <img
                src={hero.src}
                alt={hero.alt}
                width={1400}
                height={875}
                loading="eager"
                decoding="async"
              />
              <figcaption className="hamd-aie-quality__media-caption">
                {REPRESENTATIVE_MEDIA_CAPTION}
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-quality__section"
        aria-labelledby="aie-quality-intro-title"
      >
        <Container width="narrow">
          <h2 id="aie-quality-intro-title" className="hamd-aie-quality__section-title">
            {page.introTitle}
          </h2>
          {page.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="hamd-aie-quality__copy">
              {paragraph}
            </p>
          ))}
        </Container>
      </section>

      <section
        className="hamd-aie-quality__section hamd-aie-quality__section--subtle"
        aria-labelledby="aie-quality-approach-title"
      >
        <Container>
          <header className="hamd-aie-quality__section-head">
            <h2 id="aie-quality-approach-title" className="hamd-aie-quality__section-title">
              {page.approachTitle}
            </h2>
            <p className="hamd-aie-quality__copy">{page.approachNote}</p>
          </header>
          <ol className="hamd-aie-quality__flow" aria-label="Quality approach">
            {page.approachSteps.map((step, index) => (
              <li key={step.title} className="hamd-aie-quality__flow-card">
                <span className="hamd-aie-quality__flow-num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="hamd-aie-quality__flow-title">{step.title}</h3>
                <p className="hamd-aie-quality__flow-copy">{step.description}</p>
              </li>
            ))}
          </ol>
          <p className="hamd-aie-quality__flow-legend" aria-hidden="true">
            Requirement → Specification → Alignment → Documentation → Preparation
          </p>
        </Container>
      </section>

      <section
        className="hamd-aie-quality__section"
        aria-labelledby="aie-quality-spec-title"
      >
        <Container>
          <div className="hamd-aie-quality__split">
            <div>
              <h2 id="aie-quality-spec-title" className="hamd-aie-quality__section-title">
                {page.specificationTitle}
              </h2>
              <p className="hamd-aie-quality__copy">{page.specificationLead}</p>
              <ul className="hamd-aie-quality__topic-list">
                {page.specificationTopics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </div>
            <figure className="hamd-aie-quality__split-media">
              <img
                src={IE_PROCESS_MEDIA.sourcingBeans.src}
                alt={IE_PROCESS_MEDIA.sourcingBeans.alt}
                width={1600}
                height={1000}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="hamd-aie-quality__media-caption">
                {REPRESENTATIVE_MEDIA_CAPTION}
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-quality__section hamd-aie-quality__section--subtle"
        aria-labelledby="aie-quality-coord-title"
      >
        <Container width="narrow">
          <h2 id="aie-quality-coord-title" className="hamd-aie-quality__section-title">
            {page.coordinationTitle}
          </h2>
          <p className="hamd-aie-quality__copy">{page.coordinationBody}</p>
          <ul className="hamd-aie-quality__theme-list">
            {portal.home.quality.themes.map((theme) => (
              <li key={theme}>{theme}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section
        className="hamd-aie-quality__section"
        aria-labelledby="aie-quality-docs-title"
      >
        <Container>
          <div className="hamd-aie-quality__split hamd-aie-quality__split--reverse">
            <div>
              <h2 id="aie-quality-docs-title" className="hamd-aie-quality__section-title">
                {page.documentationTitle}
              </h2>
              <p className="hamd-aie-quality__copy">{page.documentationBody}</p>
            </div>
            <figure className="hamd-aie-quality__split-media">
              <img
                src={IE_PROCESS_MEDIA.documentation.src}
                alt={IE_PROCESS_MEDIA.documentation.alt}
                width={1600}
                height={1000}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="hamd-aie-quality__media-caption">
                {REPRESENTATIVE_MEDIA_CAPTION}
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-quality__section hamd-aie-quality__section--subtle"
        aria-labelledby="aie-quality-dest-title"
      >
        <Container width="narrow">
          <h2 id="aie-quality-dest-title" className="hamd-aie-quality__section-title">
            {page.destinationTitle}
          </h2>
          <p className="hamd-aie-quality__copy">{page.destinationBody}</p>
        </Container>
      </section>

      <section
        className="hamd-aie-quality__section"
        aria-labelledby="aie-quality-commodity-title"
      >
        <Container width="narrow">
          <h2 id="aie-quality-commodity-title" className="hamd-aie-quality__section-title">
            {page.commodityTitle}
          </h2>
          {hasPublishedCommodities ? (
            <>
              <p className="hamd-aie-quality__copy">
                Commodity-linked quality notes appear on each published commodity page.
                We do not invent laboratory claims, certifications, or country lists here.
              </p>
              <ul className="hamd-aie-quality__topic-list">
                {commodities.map((item) => (
                  <li key={item.slug}>
                    <ButtonLink href={IE_PATHS.commodity(item.slug)} variant="secondary">
                      {item.name}
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="hamd-aie-quality__empty-panel" role="status">
              <h3 className="hamd-aie-quality__empty-title">{page.commodityEmptyTitle}</h3>
              <p className="hamd-aie-quality__copy">{page.commodityEmptyBody}</p>
              <div className="hamd-aie-quality__actions">
                <ButtonLink href={IE_PATHS.commodities} variant="secondary">
                  Explore Commodities
                </ButtonLink>
              </div>
            </div>
          )}
        </Container>
      </section>

      <section
        className="hamd-aie-quality__section hamd-aie-quality__section--subtle"
        aria-labelledby="aie-quality-buyer-title"
      >
        <Container width="narrow">
          <h2 id="aie-quality-buyer-title" className="hamd-aie-quality__section-title">
            {page.buyerTitle}
          </h2>
          <p className="hamd-aie-quality__copy">{page.buyerLead}</p>
          <ul className="hamd-aie-quality__topic-list">
            {page.buyerTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section
        className="hamd-aie-quality__section hamd-aie-quality__section--cta"
        aria-labelledby="aie-quality-cta-title"
      >
        <Container width="narrow">
          <h2 id="aie-quality-cta-title" className="hamd-aie-quality__section-title">
            {portal.home.finalCta.title}
          </h2>
          <p className="hamd-aie-quality__copy">{portal.home.finalCta.description}</p>
          <div className="hamd-aie-quality__actions">
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
            <ButtonLink href={IE_PATHS.process} variant="secondary">
              {page.processLinkLabel}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
