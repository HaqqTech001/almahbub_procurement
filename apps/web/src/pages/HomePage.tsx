import { useEffect } from "react";
import {
  GlobalHeader,
  GlobalFooter,
  FooterSeoJsonLd,
} from "@hamd/ui/navigation";
import { WhyChooseUsSection, TestimonialsSection, FaqSection, CtaSection } from "@hamd/ui/homepage";
import { ButtonLink } from "@hamd/ui/primitives";
import { useTheme } from "../app/providers/ThemeProvider.js";
import { homepageFooter, homepageSeo, homepageBelowFold } from "../content/homepage.js";
import { COMMERCE } from "../content/commerce.js";
import {
  InternationalCategories,
  ExportCommodities,
} from "../components/CommerceCatalogue.js";
import { usePublicHeaderProps } from "../lib/use-public-header-props.js";
import {
  newsletterSuccessMessage,
  subscribeNewsletter,
} from "../lib/newsletter.js";
import { applyDocumentSeo } from "../lib/seo-homepage.js";
import { IE_PATHS } from "../integrated-export/ie-paths.js";

export function HomePage() {
  const { theme, setTheme } = useTheme();
  const header = usePublicHeaderProps({
    theme,
    onThemeChange: setTheme,
    transparentUntilScroll: false,
  });
  useEffect(() => {
    applyDocumentSeo(homepageSeo);
  }, []);
  return (
    <div className="commerce-home" data-testid="homepage">
      <FooterSeoJsonLd
        organizationName="Almahbub"
        url={homepageSeo.canonicalUrl}
      />
      <GlobalHeader
        {...header}
      />
      <main id="main-content">
        <section className="commerce-hero commerce-hero--global">
          <div className="commerce-hero__visual" aria-hidden="true">
            <span className="commerce-hero__orb commerce-hero__orb--one" />
            <span className="commerce-hero__orb commerce-hero__orb--two" />
            <span className="commerce-hero__grid" />
            <span className="commerce-hero__signal commerce-hero__signal--one" />
            <span className="commerce-hero__signal commerce-hero__signal--two" />
          </div>
          <div className="commerce-wrap">
            <p className="commerce-eyebrow">{COMMERCE.eyebrow}</p>
            <h1>
              {COMMERCE.headline}
              <span>{COMMERCE.sourcing}</span>
              <span>{COMMERCE.supplying}</span>
            </h1>
            <p className="commerce-lead">{COMMERCE.description}</p>
            <nav
              className="commerce-actions"
              aria-label="Explore our operations"
            >
              <ButtonLink href="#international" variant="secondary">
                Global Procurement
              </ButtonLink>
              <ButtonLink href="#integrated-export" variant="secondary">
                Nigerian Export
              </ButtonLink>
            </nav>
          </div>
        </section>
        <section
          id="international"
          className="commerce-operation commerce-wrap"
          aria-labelledby="international-title"
        >
          <p className="commerce-eyebrow">
            {COMMERCE.international.positioning}
          </p>
          <h2 id="international-title">{COMMERCE.international.name}</h2>
          <p className="commerce-lead">{COMMERCE.international.description}</p>
          <InternationalCategories />
          <ButtonLink href="/businesses/almahbub-international">
            Explore Global Procurement
          </ButtonLink>
        </section>
        <section
          id="integrated-export"
          className="commerce-operation commerce-wrap"
          aria-labelledby="export-title"
        >
          <p className="commerce-eyebrow">{COMMERCE.export.positioning}</p>
          <h2 id="export-title">{COMMERCE.export.name}</h2>
          <p className="commerce-lead">{COMMERCE.export.description}</p>
          <ExportCommodities />
          <ButtonLink href={IE_PATHS.home}>
            Explore Nigerian Export
          </ButtonLink>
        </section>
        {homepageBelowFold.whyChooseUs && <WhyChooseUsSection {...homepageBelowFold.whyChooseUs} />}
        {homepageBelowFold.testimonials && <TestimonialsSection {...homepageBelowFold.testimonials} autoRotateMs={0} />}
        {homepageBelowFold.faq && <FaqSection
          {...homepageBelowFold.faq}
          items={homepageBelowFold.faq.items.slice(0, 6)}
        />}
        <CtaSection
          title="Tell us what you need."
          description="Share the item or commodity, quantity, specifications and destination so our team can prepare your quotation."
          primaryCta={{ href: "/app/requests/new", label: "Request import procurement" }}
          secondaryCta={{ href: IE_PATHS.request, label: "Request an export quotation" }}
        />
      </main>
      <GlobalFooter
        {...homepageFooter}
        onNewsletterSubmit={async (email) => {
          await subscribeNewsletter(email);
        }}
        newsletterSuccessMessage={newsletterSuccessMessage}
      />
    </div>
  );
}
