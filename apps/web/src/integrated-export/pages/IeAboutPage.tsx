import { ButtonLink, Container } from "../../components/index.js";
import {
  ALMAHBUB_INTEGRATED_EXPORT,
  ALMAHBUB_INTERNATIONAL,
  GROUP,
  INTEGRATED_EXPORT_PORTAL,
} from "../../content/group.js";
import {
  IE_PROCESS_MEDIA,
  REPRESENTATIVE_MEDIA_CAPTION,
} from "../../content/media-assets.js";
import { IE_CTA, IE_PATHS } from "../ie-paths.js";

/**
 * IE-7 About - content-safe business identity only.
 * No invented history, statistics, facilities, certifications, or testimonials.
 */
export function IeAboutPage() {
  const portal = INTEGRATED_EXPORT_PORTAL;
  const page = portal.aboutPage;
  const business = ALMAHBUB_INTEGRATED_EXPORT;
  const hero = IE_PROCESS_MEDIA.sourcingBeans;

  return (
    <div className="hamd-aie-about">
      <section className="hamd-aie-about__hero" aria-labelledby="aie-about-hero-title">
        <Container>
          <div className="hamd-aie-about__hero-grid">
            <div className="hamd-aie-about__hero-copy">
              <p className="hamd-aie-about__eyebrow">{GROUP.endorsement}</p>
              <p className="hamd-aie-about__brand">{business.name}</p>
              <h1 id="aie-about-hero-title" className="hamd-aie-about__title">
                {page.heroTitle}
              </h1>
              <p className="hamd-aie-about__lead">{page.heroLead}</p>
              <div className="hamd-aie-about__actions">
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
            <figure className="hamd-aie-about__hero-media">
              <img
                src={hero.src}
                alt={hero.alt}
                width={1600}
                height={1000}
                loading="eager"
                decoding="async"
              />
              <figcaption className="hamd-aie-about__media-caption">
                {REPRESENTATIVE_MEDIA_CAPTION}
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-about__section"
        aria-labelledby="aie-about-who-title"
      >
        <Container width="narrow">
          <h2 id="aie-about-who-title" className="hamd-aie-about__section-title">
            {page.whoTitle}
          </h2>
          {page.who.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="hamd-aie-about__copy">
              {paragraph}
            </p>
          ))}
          <p className="hamd-aie-about__focus-line">
            Focus: {business.focus}
          </p>
        </Container>
      </section>

      <section
        className="hamd-aie-about__section hamd-aie-about__section--subtle"
        aria-labelledby="aie-about-focus-title"
      >
        <Container>
          <header className="hamd-aie-about__section-head">
            <h2 id="aie-about-focus-title" className="hamd-aie-about__section-title">
              {page.focusTitle}
            </h2>
            <p className="hamd-aie-about__copy">{page.focusLead}</p>
          </header>
          <ul className="hamd-aie-about__focus-grid">
            {page.focusAreas.map((area) => (
              <li key={area.title} className="hamd-aie-about__focus-card">
                <h3 className="hamd-aie-about__focus-title">{area.title}</h3>
                <p className="hamd-aie-about__focus-copy">{area.description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section
        className="hamd-aie-about__section"
        aria-labelledby="aie-about-group-title"
      >
        <Container>
          <div className="hamd-aie-about__split">
            <div>
              <h2 id="aie-about-group-title" className="hamd-aie-about__section-title">
                {page.groupTitle}
              </h2>
              <p className="hamd-aie-about__copy">{page.groupLead}</p>
              <p className="hamd-aie-about__copy">{page.groupNote}</p>
              <div
                className="hamd-aie-about__tree"
                aria-label={`${page.groupRootLabel}: ${page.groupInternationalLabel} and ${page.groupIeLabel}`}
              >
                <p className="hamd-aie-about__tree-root">{page.groupRootLabel}</p>
                <ul className="hamd-aie-about__tree-branches">
                  <li>
                    <span className="hamd-aie-about__tree-label">
                      {page.groupInternationalLabel}
                    </span>
                    <span className="hamd-aie-about__tree-meta">
                      {ALMAHBUB_INTERNATIONAL.focusShort}
                    </span>
                  </li>
                  <li className="is-current">
                    <span className="hamd-aie-about__tree-label">
                      {page.groupIeLabel}
                    </span>
                    <span className="hamd-aie-about__tree-meta">{business.focusShort}</span>
                  </li>
                </ul>
              </div>
              <div className="hamd-aie-about__actions">
                <ButtonLink href={GROUP.href} variant="secondary">
                  {page.groupExploreLabel}
                </ButtonLink>
                <ButtonLink href={ALMAHBUB_INTERNATIONAL.href} variant="secondary">
                  {page.groupInternationalCta}
                </ButtonLink>
              </div>
            </div>
            <figure className="hamd-aie-about__split-media">
              <img
                src={IE_PROCESS_MEDIA.heroPort.src}
                alt={IE_PROCESS_MEDIA.heroPort.alt}
                width={1400}
                height={875}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="hamd-aie-about__media-caption">
                {REPRESENTATIVE_MEDIA_CAPTION}
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-about__section hamd-aie-about__section--subtle"
        aria-labelledby="aie-about-how-title"
      >
        <Container>
          <header className="hamd-aie-about__section-head">
            <h2 id="aie-about-how-title" className="hamd-aie-about__section-title">
              {page.howTitle}
            </h2>
            <p className="hamd-aie-about__copy">{page.howLead}</p>
          </header>
          <ol className="hamd-aie-about__flow" aria-label="How we work">
            {page.howSteps.map((step, index) => (
              <li key={step.title} className="hamd-aie-about__flow-card">
                <span className="hamd-aie-about__flow-num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="hamd-aie-about__flow-title">{step.title}</h3>
                <p className="hamd-aie-about__flow-copy">{step.description}</p>
              </li>
            ))}
          </ol>
          <p className="hamd-aie-about__flow-legend" aria-hidden="true">
            Understand → Align → Coordinate → Prepare
          </p>
          <div className="hamd-aie-about__actions">
            <ButtonLink href={IE_PATHS.process} variant="secondary">
              {page.howLinkLabel}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-about__section"
        aria-labelledby="aie-about-buyer-title"
      >
        <Container width="narrow">
          <h2 id="aie-about-buyer-title" className="hamd-aie-about__section-title">
            {page.buyerTitle}
          </h2>
          <p className="hamd-aie-about__copy">{page.buyerLead}</p>
          <ul className="hamd-aie-about__topic-list">
            {page.buyerTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
          <div className="hamd-aie-about__actions">
            <ButtonLink href={IE_PATHS.quality} variant="secondary">
              {page.buyerLinkLabel}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-about__section hamd-aie-about__section--subtle"
        aria-labelledby="aie-about-coord-title"
      >
        <Container width="narrow">
          <h2 id="aie-about-coord-title" className="hamd-aie-about__section-title">
            {page.coordinateTitle}
          </h2>
          <p className="hamd-aie-about__copy">{page.coordinateLead}</p>
          <ul className="hamd-aie-about__point-list">
            {page.coordinatePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section
        className="hamd-aie-about__section hamd-aie-about__section--cta"
        aria-labelledby="aie-about-cta-title"
      >
        <Container width="narrow">
          <h2 id="aie-about-cta-title" className="hamd-aie-about__section-title">
            {portal.home.finalCta.title}
          </h2>
          <p className="hamd-aie-about__copy">{portal.home.finalCta.description}</p>
          <div className="hamd-aie-about__actions">
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
            <ButtonLink href={IE_PATHS.contact} variant="secondary">
              Contact
            </ButtonLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
