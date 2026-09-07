import { ButtonLink, Container } from "../../components/index.js";
import {
  IE_PROCESS_MEDIA,
  REPRESENTATIVE_MEDIA_CAPTION,
} from "../../content/media-assets.js";
import { INTEGRATED_EXPORT_PORTAL } from "../../content/group.js";
import { IE_CTA, IE_PATHS } from "../ie-paths.js";

type StepVisual = {
  media: (typeof IE_PROCESS_MEDIA)[keyof typeof IE_PROCESS_MEDIA];
  loading: "eager" | "lazy";
};

/**
 * Map only stages that have suitable representative imagery.
 * Steps without a mapped photo still render - text remains authoritative.
 */
const STEP_VISUALS: Readonly<Record<number, StepVisual>> = {
  0: { media: IE_PROCESS_MEDIA.documentation, loading: "lazy" },
  2: { media: IE_PROCESS_MEDIA.sourcingBeans, loading: "lazy" },
  3: { media: IE_PROCESS_MEDIA.qualityBeans, loading: "lazy" },
  4: { media: IE_PROCESS_MEDIA.documentation, loading: "lazy" },
  5: { media: IE_PROCESS_MEDIA.logisticsShip, loading: "lazy" },
};

/**
 * IE-4 production process page - approved journey copy + representative imagery.
 */
export function IeProcessPage() {
  const portal = INTEGRATED_EXPORT_PORTAL;
  const page = portal.processPage;
  const steps = portal.home.process.steps;
  const hero = IE_PROCESS_MEDIA.heroPort;

  return (
    <div className="hamd-aie-process">
      <section className="hamd-aie-process__hero" aria-labelledby="aie-process-hero-title">
        <Container>
          <div className="hamd-aie-process__hero-grid">
            <div className="hamd-aie-process__hero-copy">
              <p className="hamd-aie-process__eyebrow">Our Process</p>
              <h1 id="aie-process-hero-title" className="hamd-aie-process__title">
                {page.heroTitle}
              </h1>
              <p className="hamd-aie-process__lead">{page.heroLead}</p>
              <div className="hamd-aie-process__actions">
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
            </div>
            <figure className="hamd-aie-process__hero-media">
              <img
                src={hero.src}
                alt={hero.alt}
                width={1800}
                height={1125}
                loading="eager"
                decoding="async"
              />
              <figcaption className="hamd-aie-process__media-caption">
                {REPRESENTATIVE_MEDIA_CAPTION}
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-process__section"
        aria-labelledby="aie-process-intro-title"
      >
        <Container width="narrow">
          <h2 id="aie-process-intro-title" className="hamd-aie-process__section-title">
            {page.introTitle}
          </h2>
          {page.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="hamd-aie-process__copy">
              {paragraph}
            </p>
          ))}
        </Container>
      </section>

      <section
        className="hamd-aie-process__section hamd-aie-process__section--subtle"
        aria-labelledby="aie-process-timeline-title"
      >
        <Container>
          <header className="hamd-aie-process__section-head">
            <h2 id="aie-process-timeline-title" className="hamd-aie-process__section-title">
              {page.timelineTitle}
            </h2>
            <p className="hamd-aie-process__copy">{page.timelineNote}</p>
          </header>
          <ol className="hamd-aie-process__timeline">
            {steps.map((step, index) => {
              const visual = STEP_VISUALS[index];
              return (
                <li key={step.title} className="hamd-aie-process__step">
                  <div className="hamd-aie-process__step-text">
                    <span className="hamd-aie-process__step-num" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="hamd-aie-process__step-title">{step.title}</h3>
                    <p className="hamd-aie-process__step-copy">{step.description}</p>
                  </div>
                  {visual ? (
                    <figure className="hamd-aie-process__step-media">
                      <img
                        src={visual.media.src}
                        alt={visual.media.alt}
                        width={1400}
                        height={875}
                        loading={visual.loading}
                        decoding="async"
                      />
                      <figcaption className="hamd-sr-only">
                        {REPRESENTATIVE_MEDIA_CAPTION}
                      </figcaption>
                    </figure>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </Container>
      </section>

      <section
        className="hamd-aie-process__section"
        aria-labelledby="aie-process-quality-title"
      >
        <Container>
          <div className="hamd-aie-process__split">
            <div>
              <h2 id="aie-process-quality-title" className="hamd-aie-process__section-title">
                {page.qualityTitle}
              </h2>
              <p className="hamd-aie-process__copy">{page.qualityBody}</p>
              <ul className="hamd-aie-process__theme-list">
                {portal.home.quality.themes.map((theme) => (
                  <li key={theme}>{theme}</li>
                ))}
              </ul>
              <div className="hamd-aie-process__actions">
                <ButtonLink href={IE_PATHS.quality} variant="secondary">
                  Learn About Quality
                </ButtonLink>
              </div>
            </div>
            <figure className="hamd-aie-process__split-media">
              <img
                src={IE_PROCESS_MEDIA.qualityBeans.src}
                alt={IE_PROCESS_MEDIA.qualityBeans.alt}
                width={1400}
                height={875}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="hamd-aie-process__media-caption">
                {REPRESENTATIVE_MEDIA_CAPTION}
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-process__section hamd-aie-process__section--subtle"
        aria-labelledby="aie-process-expect-title"
      >
        <Container width="narrow">
          <h2 id="aie-process-expect-title" className="hamd-aie-process__section-title">
            {page.expectationsTitle}
          </h2>
          <ul className="hamd-aie-process__expect-list">
            {page.expectations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section
        className="hamd-aie-process__section hamd-aie-process__section--cta"
        aria-labelledby="aie-process-cta-title"
      >
        <Container width="narrow">
          <h2 id="aie-process-cta-title" className="hamd-aie-process__section-title">
            {portal.home.finalCta.title}
          </h2>
          <p className="hamd-aie-process__copy">{portal.home.finalCta.description}</p>
          <div className="hamd-aie-process__actions">
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
