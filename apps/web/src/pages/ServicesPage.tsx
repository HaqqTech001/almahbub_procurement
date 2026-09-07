import { useEffect } from "react";
import { ServicesSection } from "@hamd/ui/homepage";
import { ContactCta } from "../components/ContactCta.js";
import { ButtonLink } from "../components/index.js";
import { PageHero } from "../components/PageHero.js";
import { servicesContent } from "../content/pages.js";
import { applyPageSeo } from "../lib/seo.js";

export function ServicesPage() {
  useEffect(() => {
    applyPageSeo(servicesContent.seo);
  }, []);

  return (
    <>
      <PageHero
        eyebrow={servicesContent.hero.eyebrow}
        title={servicesContent.hero.title}
        description={servicesContent.hero.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Services" },
        ]}
        actions={
          <ButtonLink href="/contact" variant="primary">
            Request Procurement
          </ButtonLink>
        }
      />
      <ServicesSection
        id="services-grid"
        title="Service lines"
        description="Four capabilities that turn discovery into accountable delivery."
        services={servicesContent.services}
      />
      <ContactCta />
    </>
  );
}
