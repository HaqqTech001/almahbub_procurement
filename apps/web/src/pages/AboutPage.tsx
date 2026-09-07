import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ContactCta } from "../components/ContactCta.js";
import {
  ButtonLink,
  Container,
  FeatureCard,
  Section,
} from "../components/index.js";
import { GroupBusinessSwitcher } from "../components/GroupBusinessSwitcher.js";
import { PageHero } from "../components/PageHero.js";
import { aboutContent } from "../content/pages.js";
import { GROUP } from "../content/group.js";
import { SITE } from "../content/site.js";
import { applyJsonLd, applyPageSeo } from "../lib/seo.js";

export function AboutPage() {
  useEffect(() => {
    applyPageSeo(aboutContent.seo);
    applyJsonLd({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: aboutContent.hero.title,
      description: aboutContent.seo.description,
      url: `${SITE.url}/about`,
      mainEntity: {
        "@type": "Organization",
        name: SITE.name,
        email: SITE.contactEmail,
      },
    });
  }, []);

  return (
    <>
      <PageHero
        eyebrow={aboutContent.hero.eyebrow}
        title={aboutContent.hero.title}
        description={aboutContent.hero.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "About" },
        ]}
        actions={
          <ButtonLink href="/contact" variant="primary">
            Contact specialist
          </ButtonLink>
        }
      />
      <Section
        id="about-story"
        title="How we work"
        description={`Governed records, named ownership, and honest status from request through delivery. Almahbub International is ${GROUP.endorsement.toLowerCase()}, alongside Almahbub Integrated Export Ltd. - a separately registered business.`}
      >
        <div className="hamd-prose">
          {aboutContent.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
          <p>
            Explore <Link to="/services">services</Link>,{" "}
            <Link to="/products">products</Link>,{" "}
            <Link to="/group">{GROUP.name}</Link>, or{" "}
            <Link to="/industries">industries</Link>.
          </p>
        </div>
        <GroupBusinessSwitcher variant="panel" />
      </Section>
      <Section
        id="about-cta"
        title="Start a qualified request"
        description="Your brief becomes a governed record - not a cart."
        tone="cta"
        actions={<ButtonLink href="/contact">Request Procurement</ButtonLink>}
      >
        <Container width="narrow">
          <FeatureCard
            title="Accountable next steps"
            description="Clarification, sourcing, quotation, and delivery with evidence on the file."
            href="/contact"
            ctaLabel="Contact us"
          />
        </Container>
      </Section>
      <ContactCta title="Prefer a direct conversation?" />
    </>
  );
}
