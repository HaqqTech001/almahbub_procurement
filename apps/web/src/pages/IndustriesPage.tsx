import { useEffect } from "react";
import { ContactCta } from "../components/ContactCta.js";
import { FeatureCard, Section, ButtonLink } from "../components/index.js";
import { PageHero } from "../components/PageHero.js";
import { industriesContent } from "../content/pages.js";
import { INDUSTRY_RECORDS, toIndustryNavItem } from "../content/industries.js";
import { applyPageSeo } from "../lib/seo.js";

export function IndustriesPage() {
  useEffect(() => {
    applyPageSeo(industriesContent.seo);
  }, []);

  return (
    <>
      <PageHero
        eyebrow={industriesContent.hero.eyebrow}
        title={industriesContent.hero.title}
        description={industriesContent.hero.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Industries" },
        ]}
        actions={
          <ButtonLink href="/contact" variant="primary">
            Request Procurement
          </ButtonLink>
        }
      />
      <Section
        id="industries-grid"
        title="Sector outcomes"
        description="Challenges mapped to accountable results."
      >
        <ul className="hamd-foundation-grid hamd-foundation-grid--2">
          {INDUSTRY_RECORDS.map(toIndustryNavItem).map((industry) => (
            <li key={industry.id}>
              <FeatureCard
                title={industry.name}
                description={`${industry.challenge} Outcome: ${industry.outcome}`}
                href={industry.href}
                ctaLabel="Explore industry"
              />
            </li>
          ))}
        </ul>
      </Section>
      <ContactCta />
    </>
  );
}
