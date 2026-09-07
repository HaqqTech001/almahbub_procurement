import { ButtonLink, Container } from "../../components/index.js";
import { INTEGRATED_EXPORT_PORTAL } from "../../content/group.js";
import { SITE } from "../../content/site.js";
import { IE_CTA, IE_PATHS } from "../ie-paths.js";

/**
 * IE-8 Contact - verified Group contact only.
 * No invented phone, WhatsApp, or export@ addresses.
 */
export function IeContactPage() {
  const page = INTEGRATED_EXPORT_PORTAL.contactPage;

  return (
    <div className="hamd-aie-contact">
      <section className="hamd-aie-contact__hero" aria-labelledby="aie-contact-hero-title">
        <Container>
          <p className="hamd-aie-contact__eyebrow">Contact</p>
          <h1 id="aie-contact-hero-title" className="hamd-aie-contact__title">
            {page.heroTitle}
          </h1>
          <p className="hamd-aie-contact__lead">{page.heroLead}</p>
          <div className="hamd-aie-contact__actions">
            <ButtonLink
              href={IE_CTA.href}
              variant="primary"
              className="hamd-aie-portal__cta"
            >
              {IE_CTA.label}
            </ButtonLink>
            <ButtonLink href={IE_PATHS.commodities} variant="secondary">
              Browse Commodities
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section
        className="hamd-aie-contact__section"
        aria-labelledby="aie-contact-intro-title"
      >
        <Container width="narrow">
          <h2 id="aie-contact-intro-title" className="hamd-aie-contact__section-title">
            {page.introTitle}
          </h2>
          {page.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="hamd-aie-contact__copy">
              {paragraph}
            </p>
          ))}
        </Container>
      </section>

      <section
        className="hamd-aie-contact__section hamd-aie-contact__section--subtle"
        aria-labelledby="aie-contact-options-title"
      >
        <Container width="narrow">
          <h2 id="aie-contact-options-title" className="hamd-aie-contact__section-title">
            {page.optionsTitle}
          </h2>
          <div className="hamd-aie-contact__channel">
            <p className="hamd-aie-contact__channel-label">{page.emailLabel}</p>
            <a
              className="hamd-aie-contact__email"
              href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Integrated Export enquiry")}`}
            >
              {SITE.contactEmail}
            </a>
            <p className="hamd-aie-contact__copy">{page.emailNote}</p>
            <p className="hamd-aie-contact__copy">{page.noPhoneNote}</p>
          </div>
          <div className="hamd-aie-contact__actions">
            <ButtonLink href="/contact" variant="secondary">
              Almahbub International contact
            </ButtonLink>
          </div>
          <p className="hamd-aie-contact__copy">{page.internationalNote}</p>
        </Container>
      </section>

      <section
        className="hamd-aie-contact__section"
        aria-labelledby="aie-contact-include-title"
      >
        <Container width="narrow">
          <h2 id="aie-contact-include-title" className="hamd-aie-contact__section-title">
            {page.includeTitle}
          </h2>
          <ul className="hamd-aie-contact__topic-list">
            {page.includeItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section
        className="hamd-aie-contact__section hamd-aie-contact__section--cta"
        aria-labelledby="aie-contact-cta-title"
      >
        <Container width="narrow">
          <h2 id="aie-contact-cta-title" className="hamd-aie-contact__section-title">
            Ready to share a requirement?
          </h2>
          <p className="hamd-aie-contact__copy">
            Use the structured enquiry form, or email the verified Group contact above.
          </p>
          <div className="hamd-aie-contact__actions">
            <ButtonLink
              href={IE_CTA.href}
              variant="primary"
              className="hamd-aie-portal__cta"
            >
              {IE_CTA.label}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
