import { Link } from "react-router-dom";

import { ButtonLink, Container } from "../../components/index.js";
import { BusinessDiscovery } from "../../components/GroupBusinessSwitcher.js";
import {
  ALMAHBUB_INTEGRATED_EXPORT,
  GROUP,
  INTEGRATED_EXPORT_PORTAL,
} from "../../content/group.js";
import { usePublishedIeCommodities } from "../commodities/use-published-ie-catalogue.js";
import { IeCommodityCard } from "../IeCommodityCard.js";
import { IE_CTA, IE_PATHS } from "../ie-paths.js";
import {
  IE_PROCESS_MEDIA,
  REPRESENTATIVE_MEDIA_CAPTION,
} from "../../content/media-assets.js";

/**
 * IE-2 production homepage - sections use verified Group/IE content only.
 * Commodity preview lists published, enquiry-led catalogue records (IE-11C).
 */
export function IeHomePage() {
  const business = ALMAHBUB_INTEGRATED_EXPORT;
  const portal = INTEGRATED_EXPORT_PORTAL;
  const home = portal.home;
  const { previews: commodities, source, error, retry } = usePublishedIeCommodities();

  return (
    <div className="hamd-aie-home">
      <section className="hamd-aie-home__hero" aria-labelledby="aie-hero-title">
        <Container>
          <div className="hamd-aie-home__hero-grid">
            <div className="hamd-aie-home__hero-copy">
              <p className="hamd-aie-home__eyebrow">
                <Link to={GROUP.href}>{portal.hero.eyebrow}</Link>
              </p>
              <h1 id="aie-hero-title" className="hamd-aie-home__title">
                {business.name}
              </h1>
              <p className="hamd-aie-home__lead">{home.heroLead}</p>
              <p className="hamd-aie-home__intro">{portal.hero.description}</p>
              <div className="hamd-aie-home__actions">
                <ButtonLink
                  href={portal.hero.primaryCta.href}
                  variant="primary"
                  className="hamd-aie-portal__cta"
                >
                  {portal.hero.primaryCta.label}
                </ButtonLink>
                <ButtonLink href={portal.hero.secondaryCta.href} variant="secondary">
                  {portal.hero.secondaryCta.label}
                </ButtonLink>
              </div>
              <p className="hamd-aie-home__note">{home.honestyNote}</p>
            </div>
            <figure className="hamd-aie-home__hero-media">
              <img
                className="hamd-aie-home__hero-media-img"
                src={IE_PROCESS_MEDIA.sourcingBeans.src}
                alt="Agricultural produce arranged for commercial trade, grains and seeds in sacks"
                width={960}
                height={720}
                loading="eager"
                decoding="async"
              />
              {REPRESENTATIVE_MEDIA_CAPTION ? (
                <figcaption className="hamd-aie-home__hero-media-label">
                  {REPRESENTATIVE_MEDIA_CAPTION}
                </figcaption>
              ) : null}
            </figure>
          </div>
        </Container>
      </section>

      <section className="hamd-aie-home__trust" aria-label="Business focus">
        <Container>
          <ul className="hamd-aie-home__trust-list">
            {home.trustStrip.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section
        className="hamd-aie-home__section"
        aria-labelledby="aie-home-intro-title"
      >
        <Container width="narrow">
          <h2 id="aie-home-intro-title" className="hamd-aie-home__section-title">
            {home.intro.title}
          </h2>
          {business.description.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="hamd-aie-home__copy">
              {paragraph}
            </p>
          ))}
          {portal.about.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="hamd-aie-home__copy">
              {paragraph}
            </p>
          ))}
          <h3 className="hamd-aie-home__subheading">{home.intro.afterEnquiryTitle}</h3>
          <p className="hamd-aie-home__copy">{home.intro.afterEnquiry}</p>
          <BusinessDiscovery
            currentSlug={business.slug}
            variant="panel"
            className="hamd-aie-portal__switcher"
          />
        </Container>
      </section>

      <section
        className="hamd-aie-home__section hamd-aie-home__section--subtle"
        aria-labelledby="aie-home-commodities-title"
      >
        <Container>
          <div className="hamd-aie-home__section-head">
            <h2 id="aie-home-commodities-title" className="hamd-aie-home__section-title">
              {home.commoditiesPreview.title}
            </h2>
            <p className="hamd-aie-home__copy">{portal.commodities.description}</p>
          </div>
          {error ? (
            <div className="hamd-aie-home__empty-panel" data-ie-catalogue-source={source} role="alert">
              <h3 className="hamd-aie-home__empty-title">We couldn't load commodities.</h3>
              <p className="hamd-aie-home__copy">Published commodities did not load.</p>
              <button type="button" className="hamd-btn hamd-btn--primary" onClick={retry}>
                Try Again
              </button>
            </div>
          ) : commodities.length > 0 ? (
            <ul className="hamd-aie-catalogue__grid" data-ie-catalogue-source={source}>
              {commodities.map((item) => (
                <li key={item.slug}>
                  <IeCommodityCard commodity={item} headingLevel={3} />
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="hamd-aie-home__empty-panel"
              data-ie-catalogue-source={source}
            >
              <h3 className="hamd-aie-home__empty-title">
                {home.commoditiesPreview.emptyTitle}
              </h3>
              <p className="hamd-aie-home__copy">
                {home.commoditiesPreview.emptyDescription}
              </p>
              <div className="hamd-aie-home__actions">
                <ButtonLink
                  href={IE_CTA.href}
                  variant="primary"
                  className="hamd-aie-portal__cta"
                >
                  {IE_CTA.label}
                </ButtonLink>
                <ButtonLink href={IE_PATHS.commodities} variant="secondary">
                  View commodities page
                </ButtonLink>
              </div>
            </div>
          )}
        </Container>
      </section>

      <section
        className="hamd-aie-home__section"
        aria-labelledby="aie-home-process-title"
      >
        <Container>
          <div className="hamd-aie-home__section-head">
            <h2 id="aie-home-process-title" className="hamd-aie-home__section-title">
              {home.process.title}
            </h2>
            <p className="hamd-aie-home__copy">{home.process.description}</p>
          </div>
          <ol className="hamd-aie-home__process">
            {home.process.steps.map((step, index) => (
              <li key={step.title} className="hamd-aie-home__process-step">
                <span className="hamd-aie-home__process-num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="hamd-aie-home__process-title">{step.title}</h3>
                <p className="hamd-aie-home__process-copy">{step.description}</p>
              </li>
            ))}
          </ol>
          <div className="hamd-aie-home__actions">
            <ButtonLink href={IE_PATHS.process} variant="secondary">
              Our Process
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-home__section hamd-aie-home__section--subtle"
        aria-labelledby="aie-home-quality-title"
      >
        <Container>
          <div className="hamd-aie-home__split">
            <div>
              <h2 id="aie-home-quality-title" className="hamd-aie-home__section-title">
                {home.quality.title}
              </h2>
              <p className="hamd-aie-home__copy">{home.quality.description}</p>
              <div className="hamd-aie-home__actions">
                <ButtonLink href={IE_PATHS.quality} variant="primary" className="hamd-aie-portal__cta">
                  Learn About Quality
                </ButtonLink>
              </div>
            </div>
            <ul className="hamd-aie-home__theme-list">
              {home.quality.themes.map((theme) => (
                <li key={theme}>{theme}</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-home__section"
        aria-labelledby="aie-home-markets-title"
      >
        <Container>
          <div className="hamd-aie-home__markets">
            <div className="hamd-aie-home__markets-copy">
              <h2 id="aie-home-markets-title" className="hamd-aie-home__section-title">
                {home.markets.title}
              </h2>
              <p className="hamd-aie-home__copy">{home.markets.description}</p>
              <div className="hamd-aie-home__actions">
                <ButtonLink href={IE_PATHS.markets} variant="secondary">
                  Explore Global Markets
                </ButtonLink>
              </div>
            </div>
            <div
              className="hamd-aie-home__markets-visual"
              aria-hidden="true"
            >
              <span className="hamd-aie-home__markets-orbit" />
              <span className="hamd-aie-home__markets-orbit hamd-aie-home__markets-orbit--mid" />
              <span className="hamd-aie-home__markets-core" />
            </div>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-home__section hamd-aie-home__section--cta"
        aria-labelledby="aie-home-cta-title"
      >
        <Container width="narrow">
          <h2 id="aie-home-cta-title" className="hamd-aie-home__section-title">
            {home.finalCta.title}
          </h2>
          <p className="hamd-aie-home__copy">{home.finalCta.description}</p>
          <div className="hamd-aie-home__actions">
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
